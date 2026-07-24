/**
 * queries.ts — Typed server-side query layer for EMS.
 *
 * Each function performs the Prisma/io work that previously lived inside the
 * `if (path === ...)` branches of `src/app/actions/db.ts`. Server Components and
 * Route Handlers call these directly (one round-trip, no client waterfall),
 * then stream the result to the client.
 *
 * Functions take an explicit `caller` (from `getCaller()`) so they can be reused
 * from Server Components without re-authenticating per call. Convenience
 * wrappers that resolve the caller themselves are exported alongside.
 *
 * IMPORTANT: return shapes mirror the legacy trpc paths 1:1 so converted pages
 * receive the exact data they expect.
 */
import { prisma } from '@/lib/prisma';
import { getCaller, type Caller } from '@/lib/auth';
import { computeBdLeaveBalance } from '@/server/leaveBalance';
import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';

export type { Caller };

export interface OrgTree {
  id: string;
  name: string;
  role: string;
  department: string | null;
  designation: string | null;
  avatarUrl: string | null;
  email: string;
  managerId: string | null;
  children: OrgTree[];
}

export type PayrollWithUser = Prisma.PayrollGetPayload<{ include: { user: true } }>;

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string;
  targetTeam: string | null;
  author: string;
  authorId: string;
  authorRole: string;
  authorDesignation: string | null;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  canEdit?: boolean;
  canDelete: boolean;
}

export interface Department {
  id: string;
  name: string;
  budget?: number | null;
  headId?: string | null;
  branchId?: string | null;
}

// ───────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ───────────────────────────────────────────────────────────────────────────

export interface ChainUser {
  id: string;
  name: string;
  role: string;
  department: string | null;
  designation: string | null;
  avatarUrl: string | null;
  email: string;
}

export interface DirectReport {
  id: string;
  name: string;
  role: string;
  department: string | null;
  designation: string | null;
  avatarUrl: string | null;
  email: string;
  status: string;
}

export interface SecondLevelReport {
  managerId: string;
  managerName: string;
  reports: DirectReport[];
}

export interface ChainOfCommand {
  chain: ChainUser[];
  directReports: DirectReport[];
  peers: DirectReport[];
  secondLevelReports: SecondLevelReport[];
}

// ───────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ───────────────────────────────────────────────────────────────────────────

/**
 * Pure date-range helper for "this period vs last period" analytics.
 * `monthsBack: 0` → current calendar month; `1` → previous calendar month;
 * `2` → two months ago. Returns inclusive start and exclusive end bounds.
 */
function monthBounds(monthsBack: number): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsBack;
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

/** Percentage change from `prev` to `curr`, rounded. Returns 0 when prev is 0. */
function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 100);
}

async function computeDashboardStats(caller: Caller | null, selectedBranch: string | null, isPrivileged: boolean) {
  const userId = caller?.id;
  // Privileged users (admin/HR/CEO/owner) see their branch (or the whole org
  // when no branch is selected). Everyone else is locked to THEIR OWN records
  // only — employees must never see org-wide headcount, payroll, or expense
  // totals. Scoping to `userId` makes every aggregate resolve to one person.
  const branchScope: string | null | undefined = isPrivileged ? (selectedBranch ?? caller?.branchId ?? null) : null;
  // Typed loosely (as the original inferred shape) because `userBranch` is spread
  // into many different model `where` clauses (payroll/expense/leave/...).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userBranch: any = isPrivileged
    ? (branchScope ? { user: { branchId: branchScope } } : {})
    : (userId ? { userId } : {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branchWhere: any = isPrivileged
    ? (branchScope ? { branchId: branchScope } : {})
    : (userId ? { id: userId } : {});

  // ── Multi-tenancy (SaaS): layer an optional tenant scope on top of branch. ──
  // tenantId is null in single-tenant deployments, so these merges are no-ops and
  // behaviour is unchanged until Tenant rows exist + `prisma db push` is run.
  const tenantId = getSelectedTenantId(caller);
  if (tenantId) {
    const userTenant = { user: { tenantId } };
    if (userBranch.user) {
      userBranch.user = { ...userBranch.user, tenantId };
    } else {
      Object.assign(userBranch, userTenant);
    }
    branchWhere.tenantId = tenantId;
  }

  const headcount = await prisma.user.count({ where: branchWhere });
  const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'Pending', ...userBranch } });
  const approvedLeaves = await prisma.leaveRequest.count({ where: { status: 'Approved', ...userBranch } });
  const rejectedLeaves = await prisma.leaveRequest.count({ where: { status: 'Rejected', ...userBranch } });
  const totalPayrollResult = await prisma.payroll.aggregate({ where: userBranch, _sum: { totalAmount: true } });
  const totalExpenseResult = await prisma.expense.aggregate({ where: userBranch, _sum: { amount: true } });
  const pendingExpenses = await prisma.expense.count({ where: { status: 'PENDING', ...userBranch } });
  const openTickets = await prisma.ticket.count({ where: { status: 'Open', ...userBranch } });

  const attendanceTrend = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day); nextDay.setDate(nextDay.getDate() + 1);
    const count = await prisma.attendance.count({ where: { date: { gte: day, lt: nextDay }, ...userBranch } });
    attendanceTrend.push({
      day: day.toLocaleDateString('en', { weekday: 'short' }),
      date: day.toISOString(),
      present: count,
      rate: headcount > 0 ? Math.round((count / headcount) * 100) : 0,
    });
  }

  const allUsers = await prisma.user.findMany({ where: branchWhere, select: { department: true } });
  const deptMap: Record<string, number> = {};
  allUsers.forEach((u) => { const d = u.department || 'Unassigned'; deptMap[d] = (deptMap[d] || 0) + 1; });
  const departmentBreakdown = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

  const allLeaves = await prisma.leaveRequest.findMany({
    where: isPrivileged ? {} : { userId },
    select: { type: true },
  });
  const leaveTypeMap: Record<string, number> = {};
  allLeaves.forEach((l) => { leaveTypeMap[l.type] = (leaveTypeMap[l.type] || 0) + 1; });
  const leaveBreakdown = Object.entries(leaveTypeMap).map(([type, count]) => ({ type, count }));

  const totalTasks = isPrivileged ? await prisma.teamTask.count() : await prisma.teamTask.count({ where: { assigneeId: userId } });
  const doneTasks = isPrivileged ? await prisma.teamTask.count({ where: { status: 'Done' } }) : await prisma.teamTask.count({ where: { assigneeId: userId, status: 'Done' } });
  const inProgressTasks = isPrivileged ? await prisma.teamTask.count({ where: { status: 'InProgress' } }) : await prisma.teamTask.count({ where: { assigneeId: userId, status: 'InProgress' } });
  const blockedTasks = isPrivileged ? await prisma.teamTask.count({ where: { status: 'Blocked' } }) : 0;

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHires = await prisma.user.findMany({
    where: isPrivileged
      ? { createdAt: { gte: thirtyDaysAgo }, ...branchWhere }
      : { id: userId },
    orderBy: { createdAt: 'desc' }, take: 5,
    select: { name: true, department: true, designation: true, createdAt: true },
  });

  const upcomingEvents = await prisma.calendarEvent.findMany({
    where: { date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 5,
    select: { title: true, date: true, type: true },
  });

  const recentNews = await prisma.companyNews.findMany({
    orderBy: { createdAt: 'desc' }, take: 3,
    select: { title: true, priority: true, createdAt: true, authorName: true },
  });

  const allExpenses = await prisma.expense.findMany({ where: userBranch, select: { category: true, amount: true, status: true } });
  const expenseCatMap: Record<string, number> = {};
  allExpenses.forEach((e) => { expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount; });
  const expenseBreakdown = Object.entries(expenseCatMap).map(([category, amount]) => ({ category, amount: Math.round(amount) }));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const presentToday = await prisma.attendance.count({ where: { date: { gte: today }, ...userBranch } });
  const attendanceRate = headcount > 0 ? Math.round((presentToday / headcount) * 100) : 0;

  // ── Derived analytics (period comparisons, run-rate, trends) ──────────────
  // All aggregations reuse the same `userBranch`/`branchWhere` scoping above
  // so employees never see org-wide figures.

  // Attendance delta: current 7-day present rate vs the prior 7-day window.
  const curStart = new Date(); curStart.setDate(curStart.getDate() - 6); curStart.setHours(0, 0, 0, 0);
  const curEnd = new Date(); curEnd.setHours(0, 0, 0, 0); curEnd.setDate(curEnd.getDate() + 1);
  const prevStart = new Date(); prevStart.setDate(prevStart.getDate() - 13); prevStart.setHours(0, 0, 0, 0);
  const prevEnd = new Date(curStart);
  const curPresent = await prisma.attendance.count({ where: { date: { gte: curStart, lt: curEnd }, ...userBranch } });
  const prevPresent = await prisma.attendance.count({ where: { date: { gte: prevStart, lt: prevEnd }, ...userBranch } });
  const curRate = headcount > 0 ? (curPresent / (headcount * 7)) * 100 : 0;
  const prevRate = headcount > 0 ? (prevPresent / (headcount * 7)) * 100 : 0;
  const attendanceDelta = Math.round(curRate - prevRate);

  // Attendance status mix over the last 7 days (for a donut).
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
  const attendanceRows = await prisma.attendance.findMany({
    where: { date: { gte: weekAgo }, ...userBranch },
    select: { status: true },
  });
  const statusMap: Record<string, number> = {};
  attendanceRows.forEach((a) => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
  const attendanceMix = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Headcount growth: hires in last 30d vs the prior 30d window.
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(); d60.setDate(d60.getDate() - 60);
  const newHires30d = await prisma.user.count({ where: { ...branchWhere, createdAt: { gte: d30 } } });
  const priorHires30d = await prisma.user.count({ where: { ...branchWhere, createdAt: { gte: d60, lt: d30 } } });
  const headcountGrowthPct = pctChange(newHires30d, priorHires30d);

  // Payroll: YTD total, last-3-month total, prior-3-month total, run-rate.
  const ytdStart = new Date(new Date().getFullYear(), 0, 1);
  const payrollYTDResult = await prisma.payroll.aggregate({ where: { ...userBranch, createdAt: { gte: ytdStart } }, _sum: { totalAmount: true } });
  const payrollYTD = payrollYTDResult._sum.totalAmount || 0;
  const { start: lmStart, end: lmEnd } = monthBounds(1);
  const { end: lm2End } = monthBounds(2);
  const { start: lm3Start, end: lm3End } = monthBounds(3);
  const last3Agg = await prisma.payroll.aggregate({ where: { ...userBranch, createdAt: { gte: lm3Start, lt: lmEnd } }, _sum: { totalAmount: true } });
  const prior3Agg = await prisma.payroll.aggregate({ where: { ...userBranch, createdAt: { gte: lm3End, lt: lm2End } }, _sum: { totalAmount: true } });
  const last3Total = last3Agg._sum.totalAmount || 0;
  const prior3Total = prior3Agg._sum.totalAmount || 0;
  const payrollRunRate = Math.round(last3Total / 3);
  const payrollDeltaPct = pctChange(last3Total, prior3Total);

  // Leave: approval rate this month vs last month.
  const { start: cmStart, end: cmEnd } = monthBounds(0);
  const thisMonthApproved = await prisma.leaveRequest.count({ where: { ...userBranch, status: 'Approved', createdAt: { gte: cmStart, lt: cmEnd } } });
  const thisMonthTotal = await prisma.leaveRequest.count({ where: { ...userBranch, createdAt: { gte: cmStart, lt: cmEnd } } });
  const lastMonthTotal = await prisma.leaveRequest.count({ where: { ...userBranch, createdAt: { gte: lmStart, lt: lmEnd } } });
  const leaveApprovalRate = thisMonthTotal > 0 ? Math.round((thisMonthApproved / thisMonthTotal) * 100) : 0;
  const leaveDeltaPct = pctChange(thisMonthTotal, lastMonthTotal);
  const leaveThisMonth = thisMonthTotal;
  const leaveLastMonth = lastMonthTotal;

  // Expense: this month vs last month + pending amount.
  const expenseThisMonthAgg = await prisma.expense.aggregate({ where: { ...userBranch, createdAt: { gte: cmStart, lt: cmEnd } }, _sum: { amount: true } });
  const expenseLastMonthAgg = await prisma.expense.aggregate({ where: { ...userBranch, createdAt: { gte: lmStart, lt: lmEnd } }, _sum: { amount: true } });
  const pendingExpenseAgg = await prisma.expense.aggregate({ where: { ...userBranch, status: 'PENDING' }, _sum: { amount: true } });
  const expenseThisMonth = expenseThisMonthAgg._sum.amount || 0;
  const expenseLastMonth = expenseLastMonthAgg._sum.amount || 0;
  const pendingExpenseAmount = pendingExpenseAgg._sum.amount || 0;
  const expenseDeltaPct = pctChange(expenseThisMonth, expenseLastMonth);

  // Task completion rate.
  const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // 12-month headcount + payroll series (oldest → newest) for trend charts.
  // Two bulk queries instead of 24 per-month calls: grab all user creation
  // timestamps once and bucket in JS, and group payroll by month/year.
  const userCreatedAts = (
    await prisma.user.findMany({
      where: branchWhere,
      select: { createdAt: true },
    })
  ).map((u) => u.createdAt.getTime()).sort((a, b) => a - b);

  const payrollByMonth = await prisma.payroll.groupBy({
    by: ['month', 'year'],
    // Scope by tenant/branch (userBranch) only — do NOT filter by `createdAt`,
    // because Payroll.createdAt is the row insertion time, not the payroll
    // period. Filtering by it silently drops historical payroll whose rows
    // were inserted >12 months ago and corrupts the trend series. We instead
    // bucket every returned period in JS against the 12-month window below.
    where: { ...userBranch },
    _sum: { totalAmount: true },
  });
  // Payroll.month is stored as a short name (e.g. "Mar"), so key by that.
  const payrollMap = new Map<string, number>();
  for (const p of payrollByMonth) payrollMap.set(`${p.year}-${p.month}`, Math.round(p._sum.totalAmount || 0));

  const trendSeries: { month: string; headcount: number; payroll: number }[] = [];
  // Precompute the 12 month-end timestamps (oldest → newest) once.
  const monthEnds: number[] = [];
  for (let i = 11; i >= 0; i--) monthEnds.push(monthBounds(i).end.getTime());
  let ptr = 0;
  for (let i = 11; i >= 0; i--) {
    const { start, end } = monthBounds(i);
    const monthLabel = start.toLocaleDateString('en', { month: 'short', year: '2-digit' });
    // Advance the pointer through the sorted creation timestamps.
    while (ptr < userCreatedAts.length && userCreatedAts[ptr] < end.getTime()) ptr++;
    const monthName = start.toLocaleString('en', { month: 'short' });
    const payroll = payrollMap.get(`${start.getFullYear()}-${monthName}`) || 0;
    trendSeries.push({ month: monthLabel, headcount: ptr, payroll });
  }

  return {
    headcount, attendanceRate, pendingLeaves, approvedLeaves, rejectedLeaves,
    totalPayroll: totalPayrollResult._sum.totalAmount || 0,
    totalExpenses: totalExpenseResult._sum.amount || 0,
    pendingExpenses, openTickets, attendanceTrend, departmentBreakdown,
    leaveBreakdown, expenseBreakdown, totalTasks, doneTasks, inProgressTasks,
    blockedTasks, recentHires, upcomingEvents, recentNews,
    isPrivileged,
    // Derived analytics
    attendanceDelta, attendanceMix,
    newHires30d, headcountGrowthPct,
    payrollYTD, payrollRunRate, payrollDeltaPct,
    leaveApprovalRate, leaveDeltaPct, leaveThisMonth, leaveLastMonth,
    expenseThisMonth, expenseLastMonth, expenseDeltaPct, pendingExpenseAmount,
    taskCompletionRate,
    trendSeries,
  };
}

// Cached wrapper: the dashboard runs ~20 DB queries, so we memoize the result
// for 60s per scope (branch + admin/CEO flag) to cut DB load and TTFB.
const cachedDashboardStats = unstable_cache(
  (caller: Caller | null, selectedBranch: string | null, isPrivileged: boolean) =>
    computeDashboardStats(caller, selectedBranch, isPrivileged),
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard'] }
);

export async function getDashboardStats(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const isPrivileged = isAdmin || isCEO;
  const selectedBranch = isPrivileged ? await getSelectedBranchId() : null;
  return cachedDashboardStats(caller, selectedBranch, isPrivileged);
}

export async function getDashboardMyOverview(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return null;
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const myAttendance = await prisma.attendance.count({ where: { userId, date: { gte: thirtyDaysAgo } } });
  const workDays = 22;
  const attendancePercent = Math.min(100, Math.round((myAttendance / workDays) * 100));
  const myPendingLeaves = await prisma.leaveRequest.count({ where: { userId, status: 'Pending' } });
  const myApprovedLeaves = await prisma.leaveRequest.count({ where: { userId, status: 'Approved' } });
  const myTotalTasks = await prisma.teamTask.count({ where: { assigneeId: userId } });
  const myDoneTasks = await prisma.teamTask.count({ where: { assigneeId: userId, status: 'Done' } });
  const myInProgressTasks = await prisma.teamTask.count({ where: { assigneeId: userId, status: 'InProgress' } });
  const myPendingTasks = await prisma.teamTask.count({ where: { assigneeId: userId, status: 'ToDo' } });
  const myRecentPayrolls = await prisma.payroll.findMany({
    where: { userId }, orderBy: { createdAt: 'desc' }, take: 3,
    select: { month: true, year: true, totalAmount: true, status: true },
  });
  const myUpcomingEvents = await prisma.calendarEvent.findMany({
    where: { date: { gte: new Date() }, OR: [
      { assigneeId: userId }, { creatorId: userId },
      { targetTeam: caller?.department || '' }, { targetTeam: null },
    ] },
    orderBy: { date: 'asc' }, take: 5,
    select: { title: true, date: true, type: true, status: true },
  });
  return {
    attendancePercent, myPendingLeaves, myApprovedLeaves, myTotalTasks,
    myDoneTasks, myInProgressTasks, myPendingTasks, myRecentPayrolls, myUpcomingEvents,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// REGISTRY / ORG
// ───────────────────────────────────────────────────────────────────────────

export const getEmployees = unstable_cache(
  () => prisma.user.findMany({ include: { manager: true }, orderBy: { name: 'asc' } }),
  ['employees'],
  { revalidate: 120, tags: ['employees'] }
);

export const getOrgTree = unstable_cache(
  async (): Promise<OrgTree> => {
    interface OrgUser {
      id: string;
      name: string;
      role: string;
      department: string | null;
      designation: string | null;
      avatarUrl: string | null;
      email: string;
      managerId: string | null;
      children: OrgUser[];
    }
    const users = await prisma.user.findMany();
    const userMap: Record<string, OrgUser> = {};
    users.forEach((u) => (userMap[u.id] = { ...u, children: [] }));
    let root: OrgUser | null = null;
    const isDescendant = (nodeId: string, ancestorId: string): boolean => {
      if (!nodeId || !userMap[nodeId]) return false;
      if (nodeId === ancestorId) return true;
      for (const child of userMap[nodeId].children) if (isDescendant(child.id, ancestorId)) return true;
      return false;
    };
    users.forEach((u) => {
      if (u.managerId && userMap[u.managerId]) {
        if (!isDescendant(u.id, u.managerId)) userMap[u.managerId].children.push(userMap[u.id]);
      } else if (!u.managerId) {
        if (!root || u.role === 'Admin' || u.role === 'CEO') root = userMap[u.id];
      }
    });
    return root || { ...users[0], children: [] };
  },
  ['org-tree'],
  { revalidate: 120, tags: ['org-tree'] }
);

/**
 * Scope-limited employee list for the directory / presence surfaces.
 *
 * Authorization: only admins, HR, CEO/owner and managers may see the org-wide
 * roster. Everyone else (regular employees) sees only themselves plus their own
 * direct reports (so a lead can see their team). This prevents a regular
 * employee from enumerating the entire workforce via the Employee Directory,
 * Org Chart, or presence grid.
 */
export async function getEmployeesScoped(caller: Caller | null) {
  if (!caller) return [];
  const privileged =
    caller.isAdmin || caller.isCEO || caller.role === 'Manager' || caller.role === 'Director';
  if (privileged) {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        phone: true,
        avatarUrl: true,
        status: true,
        isOnboarded: true,
        isOwner: true,
        employmentType: true,
        joinDate: true,
        baseSalary: true,
        bloodGroup: true,
        religion: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        country: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        bio: true,
        linkedin: true,
        github: true,
        twitter: true,
        website: true,
        nidMasked: true,
        lastSeen: true,
        isOnline: true,
        twoFactorEnabled: true,
        permissions: true,
        managerId: true,
        manager: { select: { id: true, name: true, role: true, designation: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
  // Non-privileged: self + direct reports only.
  const reports = await prisma.user.findMany({
    where: { managerId: caller.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      designation: true,
      phone: true,
      avatarUrl: true,
      status: true,
      isOnboarded: true,
      employmentType: true,
      joinDate: true,
      bloodGroup: true,
      dateOfBirth: true,
      gender: true,
      city: true,
      country: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      bio: true,
      linkedin: true,
      github: true,
      twitter: true,
      website: true,
      lastSeen: true,
      isOnline: true,
      managerId: true,
      manager: { select: { id: true, name: true, role: true, designation: true } },
    },
    orderBy: { name: 'asc' },
  });
  const self = await prisma.user.findUnique({
    where: { id: caller.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      designation: true,
      phone: true,
      avatarUrl: true,
      status: true,
      isOnboarded: true,
      isOwner: true,
      employmentType: true,
      joinDate: true,
      baseSalary: true,
      bloodGroup: true,
      religion: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      city: true,
      country: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      bio: true,
      linkedin: true,
      github: true,
      twitter: true,
      website: true,
      nidMasked: true,
      lastSeen: true,
      isOnline: true,
      twoFactorEnabled: true,
      permissions: true,
      managerId: true,
      manager: { select: { id: true, name: true, role: true, designation: true } },
    },
  });
  return self ? [self, ...reports] : reports;
}

// ───────────────────────────────────────────────────────────────────────────
// TEAM
// ───────────────────────────────────────────────────────────────────────────

export async function getMyTeam(caller: Caller | null): Promise<{ teamId: string; directReports: { id: string; name: string; designation: string | null; avatarUrl: string | null }[] }> {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  if (isAdmin || isCEO) return { teamId: 'all', directReports: await prisma.user.findMany() };
  const directReports = await prisma.user.findMany({ where: { managerId: userId } });
  return { teamId: 'my_team', directReports };
}

export async function getChainOfCommand(caller: Caller | null): Promise<ChainOfCommand> {
  const userId = caller?.id;
  if (!userId || !caller) return { chain: [], directReports: [], peers: [], secondLevelReports: [] };

  const allUsers = await prisma.user.findMany({ select: { id: true, managerId: true, name: true, role: true, department: true, designation: true, avatarUrl: true, email: true, status: true } });
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const chain: ChainUser[] = [];
  let currentId: string | undefined = userId;
  while (currentId) {
    const u = userMap.get(currentId);
    if (!u) break;
    if (chain.some((c) => c.id === u.id)) break;
    chain.push({ id: u.id, name: u.name, role: u.role, department: u.department, designation: u.designation, avatarUrl: u.avatarUrl, email: u.email });
    currentId = u.managerId ?? undefined;
  }

  const directReports: DirectReport[] = allUsers
    .filter((u) => u.managerId === userId)
    .map((u) => ({ id: u.id, name: u.name, role: u.role, department: u.department, designation: u.designation, avatarUrl: u.avatarUrl, email: u.email, status: u.status }));
  const peers: DirectReport[] = caller.managerId
    ? allUsers
        .filter((u) => u.managerId === caller.managerId && u.id !== userId)
        .map((u) => ({ id: u.id, name: u.name, role: u.role, department: u.department, designation: u.designation, avatarUrl: u.avatarUrl, email: u.email, status: u.status }))
    : [];
  const secondLevelReports: SecondLevelReport[] = [];
  if (directReports.length > 0) {
    const reportIds = directReports.map((r) => r.id);
    const subReports = allUsers.filter((u) => u.managerId && reportIds.includes(u.managerId));
    const byManager = new Map<string, typeof subReports>();
    for (const s of subReports) {
      const key = s.managerId as string;
      if (!byManager.has(key)) byManager.set(key, []);
      byManager.get(key)!.push(s);
    }
    for (const report of directReports) {
      const subs = byManager.get(report.id) ?? [];
      if (subs.length > 0) secondLevelReports.push({ managerId: report.id, managerName: report.name, reports: subs });
    }
  }
  return { chain, directReports, peers, secondLevelReports };
}

export async function getTeamTasks(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  if (!userId) return [];
  if (isAdmin || isCEO) {
    return prisma.teamTask.findMany({
      include: { assignee: { select: { id: true, name: true, avatarUrl: true, designation: true } }, assigner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }).then((tasks) => tasks.map((t) => ({ ...t, status: t.status as 'ToDo' | 'InProgress' | 'Done' | 'Blocked', dueDate: t.dueDate?.toISOString() || null })));
  }
  const directReportIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map((u) => u.id);
  return prisma.teamTask.findMany({
    where: { OR: [{ assigneeId: userId }, { assignerId: userId }, { assigneeId: { in: directReportIds } }] },
    include: { assignee: { select: { id: true, name: true, avatarUrl: true, designation: true } }, assigner: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  }).then((tasks) => tasks.map((t) => ({ ...t, status: t.status as 'ToDo' | 'InProgress' | 'Done' | 'Blocked', dueDate: t.dueDate?.toISOString() || null })));
}

// Cached wrapper: the rewritten function already uses ~4 bulk queries, but the
// result is still per-viewer and fairly stable, so we memoize for 30s to cut
// DB load and speed up the Team page.
const cachedTeamPerformance = unstable_cache(
  (userId: string, isPrivileged: boolean) =>
    getTeamPerformanceForUser(userId, isPrivileged),
  ['team-performance'],
  { revalidate: 30, tags: ['team'] }
);

export async function getTeamPerformance(caller: Caller | null): Promise<{ id: string; name: string; designation: string | null; department: string | null; avatarUrl: string | null; totalTasks: number; doneTasks: number; inProgressTasks: number; blockedTasks: number; doneThisWeek: number; completionRate: number; attendanceRate: number }[]> {
  const userId = caller?.id;
  if (!userId) return [];
  const isPrivileged = caller?.isAdmin || caller?.isCEO;
  return cachedTeamPerformance(userId, isPrivileged);
}

// Internal: the actual query logic, separated so it can be cached by userId.
async function getTeamPerformanceForUser(userId: string, isPrivileged: boolean) {
  const memberIds: string[] = [];
  if (isPrivileged) memberIds.push(...(await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
  else {
    memberIds.push(...(await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map((u) => u.id));
    memberIds.push(userId);
  }
  const ids = memberIds.slice(0, 20);
  if (ids.length === 0) return [];

  const members = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, designation: true, department: true, avatarUrl: true },
  });

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const taskGroups = await prisma.teamTask.groupBy({
    by: ['assigneeId', 'status'],
    where: { assigneeId: { in: ids } },
    _count: { _all: true },
  });
  const doneWeekGroups = await prisma.teamTask.groupBy({
    by: ['assigneeId'],
    where: { assigneeId: { in: ids }, status: 'Done', completedAt: { gte: weekAgo } },
    _count: { _all: true },
  });
  const attendanceGroups = await prisma.attendance.groupBy({
    by: ['userId'],
    where: { userId: { in: ids }, date: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });

  const byId = new Map<string, Record<string, number>>();
  for (const g of taskGroups) {
    if (!byId.has(g.assigneeId)) byId.set(g.assigneeId, {});
    byId.get(g.assigneeId)![g.status] = g._count._all;
  }
  const doneWeekById = new Map(doneWeekGroups.map((g) => [g.assigneeId, g._count._all]));
  const attById = new Map(attendanceGroups.map((g) => [g.userId, g._count._all]));

  return members.map((m) => {
    const counts = byId.get(m.id) || {};
    const totalTasks = Object.values(counts).reduce((s, n) => s + n, 0);
    const doneTasks = counts['Done'] || 0;
    const inProgressTasks = counts['InProgress'] || 0;
    const blockedTasks = counts['Blocked'] || 0;
    const doneThisWeek = doneWeekById.get(m.id) || 0;
    const attendanceRate = Math.min(100, Math.round(((attById.get(m.id) || 0) / 22) * 100));
    return {
      ...m,
      totalTasks,
      doneTasks,
      inProgressTasks,
      blockedTasks,
      doneThisWeek,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      attendanceRate,
    };
  });
}

export async function getProxyStatus(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { proxyId: true, proxy: { select: { id: true, name: true } } } });
}

// ───────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ───────────────────────────────────────────────────────────────────────────

export async function getAttendanceLogs(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  if (isAdmin || isCEO) {
    const branchScope = (isAdmin || isCEO) ? await getSelectedBranchId() : null;
    const userBranch = branchScope ? { user: { branchId: branchScope } } : {};
    const logs = await prisma.attendance.findMany({ where: userBranch, include: { user: true }, orderBy: { date: 'desc' }, take: 100 });
    return logs.map((l) => ({ ...l, userName: l.user.name }));
  }
  const logs = await prisma.attendance.findMany({ where: { userId }, include: { user: true }, orderBy: { date: 'desc' }, take: 50 });
  return logs.map((l) => ({ ...l, userName: l.user.name }));
}

export async function getAttendanceAdminStats(caller?: Caller | null) {
  const isPrivileged = caller?.isAdmin || caller?.isCEO;
  const branchScope = isPrivileged ? await getSelectedBranchId() : null;
  const tenantId = getSelectedTenantId(caller);
  const userBranch: Prisma.AttendanceWhereInput = branchScope || tenantId
    ? {
        ...(branchScope ? { user: { branchId: branchScope } } : {}),
        ...(tenantId ? { user: { tenantId } } : {}),
      }
    : {};
  const branchWhere = tenantId
    ? { ...(branchScope ? { branchId: branchScope } : {}), tenantId } as Prisma.UserWhereInput
    : (branchScope ? { branchId: branchScope } : {});
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const onShift = await prisma.attendance.count({ where: { date: { gte: today }, clockOut: null, ...userBranch } });
  const lateArrivals = await prisma.attendance.count({ where: { date: { gte: today }, status: 'Late', ...userBranch } });
  // Explicit "Absent" records plus shift-assigned employees who haven't punched in yet today.
  const explicitAbsent = await prisma.attendance.count({ where: { date: { gte: today }, status: 'Absent', ...userBranch } });
  const assignedButMissing = await prisma.shiftAssignment.count({
    where: { date: { gte: today }, ...(branchScope || tenantId ? { user: { ...(branchScope ? { branchId: branchScope } : {}), ...(tenantId ? { tenantId } : {}) } } : {}) },
  });
  const absent = Math.max(explicitAbsent, assignedButMissing > onShift ? assignedButMissing - onShift : 0);
  const totalEmployees = await prisma.user.count({ where: branchWhere });

  // Derived analytics: present rate, absenteeism rate, on-shift %, and a
  // 7-day present-rate trend for the trend chart.
  const presentToday = await prisma.attendance.count({ where: { date: { gte: today }, status: { not: 'Absent' }, ...userBranch } });
  const presentRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const absenteeismRate = totalEmployees > 0 ? Math.round((absent / totalEmployees) * 100) : 0;
  const onShiftPct = totalEmployees > 0 ? Math.round((onShift / totalEmployees) * 100) : 0;

  const attendanceTrend = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day); nextDay.setDate(nextDay.getDate() + 1);
    const present = await prisma.attendance.count({ where: { date: { gte: day, lt: nextDay }, status: { not: 'Absent' }, ...userBranch } });
    const total = await prisma.attendance.count({ where: { date: { gte: day, lt: nextDay }, ...userBranch } });
    attendanceTrend.push({
      day: day.toLocaleDateString('en', { weekday: 'short' }),
      rate: total > 0 ? Math.round((present / totalEmployees) * 100) : 0,
    });
  }

  return { onShift, lateArrivals, absent, totalEmployees, presentRate, absenteeismRate, onShiftPct, attendanceTrend };
}

export async function getActiveAttendanceSession(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return prisma.attendance.findFirst({ where: { userId, date: { gte: today }, clockOut: null }, orderBy: { clockIn: 'desc' } });
}

// ───────────────────────────────────────────────────────────────────────────
// LEAVE
// ───────────────────────────────────────────────────────────────────────────

export async function getLeaveRequests(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  if (isAdmin || isCEO) {
    const branchScope = await getSelectedBranchId();
    const userBranch = branchScope ? { user: { branchId: branchScope } } : {};
    return prisma.leaveRequest.findMany({ where: userBranch, include: { user: true }, orderBy: { createdAt: 'desc' } });
  }
  return prisma.leaveRequest.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
}

export async function getLeaveBalance(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const startYear = new Date(new Date().getFullYear(), 0, 1);
  const usedRows = await prisma.leaveRequest.findMany({
    where: { userId, status: 'Approved', startDate: { gte: startYear } },
    select: { type: true, days: true },
  });
  // Map free-text leave `type` to its LeaveType.category bucket so balances
  // reconcile. Unknown types fall back to the raw type string.
  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
  const typeToCategory = new Map(leaveTypes.map((lt) => [lt.name, lt.category]));
  const usedByCategory: Record<string, number> = {};
  for (const r of usedRows) {
    const category = typeToCategory.get(r.type) || r.type;
    usedByCategory[category] = (usedByCategory[category] || 0) + (r.days || 0);
  }
  return computeBdLeaveBalance({ createdAt: user?.createdAt, usedByCategory, gender: user?.gender });
}

/** Active BD leave types used to populate the request form and balance labels. */
export async function getLeaveTypes(): Promise<{ id: string; name: string; nameBn: string | null; category: string; defaultDays: number; isPaid: boolean; applicableGender: string | null; isActive: boolean }[]> {
  return prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { category: 'asc' } });
}

// ───────────────────────────────────────────────────────────────────────────
// PAYROLL
// ───────────────────────────────────────────────────────────────────────────

export async function getPayrolls(caller: Caller | null): Promise<(Prisma.PayrollGetPayload<{ include: { user: true } }>)[]> {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  if (isAdmin || isCEO) {
    const branchScope = await getSelectedBranchId();
    const userBranch = branchScope ? { user: { branchId: branchScope } } : {};
    return prisma.payroll.findMany({ where: userBranch, include: { user: true }, orderBy: { createdAt: 'desc' } });
  }
  return prisma.payroll.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
}

export async function getSalaryHeads() {
  return prisma.salaryHead.findMany();
}

export async function getPayrollAdminStats(caller?: Caller | null) {
  const isPrivileged = caller?.isAdmin || caller?.isCEO;
  const branchScope = isPrivileged ? await getSelectedBranchId() : null;
  const userBranch = branchScope ? { user: { branchId: branchScope } } : {};
  const branchWhere = branchScope ? { branchId: branchScope } : {};

  const ytdStart = new Date(new Date().getFullYear(), 0, 1);
  const totalPayroll = await prisma.payroll.aggregate({ where: { ...userBranch, createdAt: { gte: ytdStart } }, _sum: { totalAmount: true } });
  const employeeCount = await prisma.user.count({ where: branchWhere });
  const lastRun = await prisma.payroll.findFirst({ where: userBranch, orderBy: { createdAt: 'desc' } });

  // Month-over-month payroll delta: sum of last 3 runs vs the 3 prior runs,
  // so a single off-cycle payment doesn't distort the trend.
  const recent = await prisma.payroll.findMany({ where: userBranch, orderBy: { createdAt: 'desc' }, take: 6, select: { totalAmount: true } });
  const last3 = recent.slice(0, 3).reduce((s, p) => s + (p.totalAmount || 0), 0);
  const prev3 = recent.slice(3, 6).reduce((s, p) => s + (p.totalAmount || 0), 0);
  const momDeltaPct = prev3 === 0 ? (last3 === 0 ? 0 : 100) : Math.round(((last3 - prev3) / prev3) * 100);

  const monthsElapsed = Math.max(1, new Date().getMonth() + 1);
  const totalYTD = totalPayroll._sum.totalAmount || 0;
  const monthlyRunRate = Math.round(totalYTD / monthsElapsed);
  const avgPerEmployee = employeeCount > 0 ? Math.round(totalYTD / employeeCount) : 0;

  // Processed vs draft runs ratio.
  const processedCount = await prisma.payroll.count({ where: { ...userBranch, status: 'PROCESSED' } });
  const draftCount = await prisma.payroll.count({ where: { ...userBranch, status: 'DRAFT' } });
  const totalRuns = processedCount + draftCount;
  const processedPct = totalRuns > 0 ? Math.round((processedCount / totalRuns) * 100) : 0;

  return {
    totalYTD,
    employeeCount,
    lastRunMonth: lastRun ? `${lastRun.month} ${lastRun.year}` : 'Never',
    lastRunStatus: lastRun?.status || 'N/A',
    monthlyRunRate,
    avgPerEmployee,
    momDeltaPct,
    processedPct,
  };
}

export async function getSalaryStructures() {
  return prisma.salaryStructure.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getPaymentsForUser(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  if (isAdmin || isCEO) return prisma.payment.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  return prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function getSalesForUser(caller: Caller | null, month?: number, year?: number) {
  const userId = caller?.id;
  const where: Record<string, unknown> = { userId };
  if (month) (where as { month?: number }).month = month;
  if (year) (where as { year?: number }).year = year;
  return prisma.sale.findMany({ where: where as Prisma.SaleWhereInput, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
}

export async function getSalesMonthTotal(userId: string, month: number, year: number) {
  const agg = await prisma.sale.aggregate({ where: { userId, month, year }, _sum: { amount: true } });
  return agg._sum.amount || 0;
}

export async function getFestivalBonuses(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  if (isAdmin || isCEO) {
    return prisma.festivalBonus.findMany({ include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
  }
  return prisma.festivalBonus.findMany({ where: { userId: caller?.id }, include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
}

// ── Training ──
export async function getTrainingCatalog(caller: Caller | null) {
  const courses = await prisma.trainingCourse.findMany({ where: { isActive: true }, orderBy: { category: 'asc' } });
  if (caller?.id) {
    const enrollments = await prisma.trainingEnrollment.findMany({ where: { userId: caller.id } });
    const byCourse = new Map(enrollments.map((e) => [e.courseId, e]));
    return courses.map((c) => ({ ...c, enrollment: byCourse.get(c.id) || null }));
  }
  return courses.map((c) => ({ ...c, enrollment: null }));
}

export async function getComplianceTraining(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  if (isAdmin || isCEO) {
    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { course: { category: 'Compliance' } },
      include: { user: { select: { name: true, id: true } }, course: true },
      orderBy: { enrolledAt: 'desc' },
    });
    return enrollments;
  }
  return prisma.trainingEnrollment.findMany({
    where: { userId: caller?.id, course: { category: 'Compliance' } },
    include: { course: true },
  });
}

/** The current user's training enrollments with full course details. */
export async function getMyTraining(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return [];
  return prisma.trainingEnrollment.findMany({
    where: { userId },
    include: { course: true },
    orderBy: { enrolledAt: 'desc' },
  });
}

/** Training compliance summary for admins: % of mandatory courses completed org-wide. */
export async function getTrainingCompliance(caller: Caller | null) {
  if (!caller?.isAdmin && !caller?.isCEO) return null;
  const mandatory = await prisma.trainingCourse.findMany({ where: { isMandatory: true, isActive: true } });
  if (mandatory.length === 0) return { mandatoryCount: 0, completedCount: 0, pct: 100 };
  const courseIds = mandatory.map((c) => c.id);
  const completed = await prisma.trainingEnrollment.count({ where: { courseId: { in: courseIds }, status: 'Completed' } });
  const totalEnrollments = await prisma.trainingEnrollment.count({ where: { courseId: { in: courseIds } } });
  const pct = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0;
  return { mandatoryCount: mandatory.length, completedCount: completed, pct };
}

// ───────────────────────────────────────────────────────────────────────────
// EXPENSES / ASSETS / HELPDESK / APPLICATIONS
// ───────────────────────────────────────────────────────────────────────────

export async function getExpenses(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const userId = caller?.id;
  if (isAdmin) return prisma.expense.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  return prisma.expense.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
}

export async function getPenalties(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const userId = caller?.id;
  if (isAdmin) return prisma.penalty.findMany({ include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
  return prisma.penalty.findMany({ where: { userId }, include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
}

export async function getAssets() {
  return prisma.asset.findMany({ include: { user: true } });
}

export async function getTickets(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const userId = caller?.id;
  if (isAdmin) return prisma.ticket.findMany({ include: { user: true, replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
  if (!userId) return [];
  return prisma.ticket.findMany({ where: { userId }, include: { user: true, replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
}

export async function getApplications() {
  return prisma.leaveRequest.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
}

export const getDepartments = unstable_cache(
  async (): Promise<Department[]> => prisma.department.findMany(),
  ['departments'],
  { revalidate: 300, tags: ['departments'] }
);

// ───────────────────────────────────────────────────────────────────────────
// AUDIT / EVENTS / NEWS / CALENDAR
// ───────────────────────────────────────────────────────────────────────────

export async function getAuditLogs() {
  const events = await prisma.event.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
  const userIds = [...new Set(events.map((e) => e.actorId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, role: true } });
  const userMap = users.reduce<Record<string, { id: string; name: string; role: string }>>((acc, u) => { acc[u.id] = u; return acc; }, {});
  return events.map((e) => ({ ...e, actorName: userMap[e.actorId]?.name || 'System', actorRole: userMap[e.actorId]?.role || 'N/A' }));
}

export async function getNews(caller: Caller | null): Promise<NewsItem[]> {
  const news = await prisma.companyNews.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: { id: true, name: true, role: true, designation: true } } },
  });
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const dept = caller?.department;
  return news
    .filter((n) => {
      if (n.category === 'Universal' || !n.targetTeam) return true;
      if (n.category === 'Team' && n.targetTeam === dept) return true;
      if (isAdmin || isCEO) return true;
      return false;
    })
    .map((n) => ({
      id: n.id, title: n.title, content: n.content, priority: n.priority, category: n.category,
      targetTeam: n.targetTeam, author: n.authorName, authorId: n.authorId, authorRole: n.author.role,
      authorDesignation: n.author.designation, isEdited: n.isEdited, isPinned: n.isPinned,
      createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
      canEdit: isAdmin || isCEO || n.authorId === caller?.id,
      canDelete: isAdmin || isCEO || n.authorId === caller?.id,
    }));
}

export async function getCalendarEvents(caller: Caller | null) {
  const userId = caller?.id;
  return prisma.calendarEvent.findMany({
    where: { OR: [{ targetTeam: null }, { targetTeam: caller?.department || '' }, { creatorId: userId || '' }, { assigneeId: userId || '' }] },
    include: { creator: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
    orderBy: { date: 'asc' },
  });
}

/**
 * Calendar feed that merges manually-created events with Bangladesh public
 * holidays, shift rosters, and employee birthdays — so the calendar is a single
 * source of truth (B3). Holidays/birthdays are read-only derived entries.
 */
export interface CalendarFeedItem {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  type: import('@/components/calendar/CalendarView').EventType;
  status: string;
  assigneeId?: string | null;
  creatorId?: string | null;
  targetTeam?: string | null;
  assignee?: { name: string } | null;
  derived: 'event' | 'holiday' | 'shift' | 'birthday';
  /** Present on holiday items when the date is moon-sighted / govt-to-confirm. */
  isTentative?: boolean;
}

export async function getCalendarFeed(caller: Caller | null, lang: 'en' | 'bn' = 'en'): Promise<CalendarFeedItem[]> {
  const userId = caller?.id;
  const [events, holidays, birthdays, shiftAssignments] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { OR: [{ targetTeam: null }, { targetTeam: caller?.department || '' }, { creatorId: userId || '' }, { assigneeId: userId || '' }] },
      include: { creator: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' },
    }),
    prisma.holiday.findMany({ orderBy: { date: 'asc' } }),
    prisma.user.findMany({
      where: { dateOfBirth: { not: null }, status: 'active' },
      select: { id: true, name: true, dateOfBirth: true },
    }),
    caller?.isAdmin || caller?.isCEO
      ? prisma.shiftAssignment.findMany({
          where: { date: { gte: new Date(new Date().getFullYear(), 0, 1) } },
          include: { user: { select: { name: true } }, shift: true },
          orderBy: { date: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  const nowYear = new Date().getFullYear();
  const items: CalendarFeedItem[] = [];

  for (const e of events) {
    items.push({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date.toISOString(),
      endDate: e.endDate?.toISOString() || null,
      type: e.type as import('@/components/calendar/CalendarView').EventType,
      status: e.status,
      assigneeId: e.assigneeId,
      creatorId: e.creatorId,
      targetTeam: e.targetTeam,
      assignee: e.assignee ? { name: e.assignee.name } : null,
      derived: 'event',
    });
  }

  for (const h of holidays) {
    const isTentative = h.category === 'Tentative';
    items.push({
      id: `holiday-${h.id}`,
      title: lang === 'bn' && h.nameBn ? h.nameBn : h.name,
      description: `Bangladesh ${h.type} holiday${isTentative ? ' (tentative — pending moon sighting / govt notification)' : ''}`,
      date: h.date.toISOString(),
      type: 'Holiday',
      status: 'Done',
      derived: 'holiday',
      isTentative,
    });
  }

  for (const u of birthdays) {
    if (!u.dateOfBirth) continue;
    const dob = new Date(u.dateOfBirth);
    const nextBday = new Date(nowYear, dob.getMonth(), dob.getDate());
    if (nextBday < new Date()) nextBday.setFullYear(nowYear + 1);
    items.push({
      id: `birthday-${u.id}`,
      title: `${u.name}'s Birthday`,
      description: 'Team birthday',
      date: nextBday.toISOString(),
      type: 'Social',
      status: 'Done',
      derived: 'birthday',
    });
  }

  for (const a of shiftAssignments) {
    items.push({
      id: `shift-${a.id}`,
      title: `${a.shift?.name || 'Shift'}: ${a.user?.name || 'Unassigned'}`,
      description: `Shift ${a.shift?.startTime}-${a.shift?.endTime}`,
      date: a.date.toISOString(),
      type: 'Meeting',
      status: 'Done',
      derived: 'shift',
    });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getMyReminders(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return [];
  return prisma.calendarEvent.findMany({
    where: { OR: [{ creatorId: userId, type: 'Reminder' }, { assigneeId: userId }], date: { gte: new Date() } },
    orderBy: { date: 'asc' }, take: 20,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// SHIFTS
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_SHIFTS = [
  { name: 'Morning', startTime: '06:00', endTime: '14:00', location: 'HQ Building' },
  { name: 'Day', startTime: '09:00', endTime: '17:00', location: 'HQ Building' },
  { name: 'Evening', startTime: '14:00', endTime: '22:00', location: 'HQ Building' },
  { name: 'Night', startTime: '22:00', endTime: '06:00', location: 'HQ Building' },
];

export async function getShifts() {
  let shifts = await prisma.shift.findMany({ orderBy: { name: 'asc' } });
  if (shifts.length === 0) {
    shifts = await prisma.$transaction(DEFAULT_SHIFTS.map((s) => prisma.shift.create({ data: s })));
  }
  return shifts;
}

export async function getShiftAssignments(caller: Caller | null, dateStr?: string) {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  const date = dateStr ? new Date(dateStr) : new Date();
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  const assignments = await prisma.shiftAssignment.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    include: { user: { select: { name: true, role: true, avatarUrl: true } }, shift: true },
    orderBy: { createdAt: 'asc' },
  });
  return assignments.map((a) => ({
    id: a.id, shiftId: a.shiftId, userId: a.userId,
    userName: a.user?.name || 'Unknown', userRole: a.user?.role || 'Staff', userAvatar: a.user?.avatarUrl || null, date: a.date,
  }));
}

// ───────────────────────────────────────────────────────────────────────────
// PERFORMANCE / REVIEWS
// ───────────────────────────────────────────────────────────────────────────

export async function getObjectives(caller: Caller | null, targetId?: string) {
  const userId = caller?.id;
  if (!userId) return [];
  const tid = targetId || userId;
  if (tid !== userId && !caller?.isAdmin && !caller?.isCEO) return [];
  return prisma.objective.findMany({ where: { userId: tid }, orderBy: { createdAt: 'desc' } });
}

export async function getReviews(caller: Caller | null, targetId?: string): Promise<{ id: string; userId: string; reviewPeriod: string; rating: string; comments: string; reviewerName: string }[]> {
  const userId = caller?.id;
  if (!userId) return [];
  const tid = targetId || userId;
  if (tid !== userId && !caller?.isAdmin && !caller?.isCEO) return [];
  const reviews = await prisma.review.findMany({
    where: { userId: tid }, include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' },
  });
  return reviews.map((r) => ({
    id: r.id,
    userId: r.userId,
    reviewPeriod: r.reviewPeriod,
    rating: r.rating,
    comments: r.comments,
    reviewerName: r.reviewer?.name || 'Manager',
  })) as { id: string; userId: string; reviewPeriod: string; rating: string; comments: string; reviewerName: string }[];
}

/**
 * getPromotionReadiness — composite promotion-score engine.
 * Blends attendance reliability, on-time task completion, objective progress
 * and manager review scores into a 0–100 readiness score.
 */
export async function getPromotionReadiness(caller: Caller | null, targetId?: string) {
  const userId = caller?.id;
  if (!userId) return null;
  const tid = targetId || userId;
  if (tid !== userId && !caller?.isAdmin && !caller?.isCEO) return null;

  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  // Attendance
  const attendance = await prisma.attendance.findMany({
    where: { userId: tid, date: { gte: since } },
  });
  const totalAtt = attendance.length || 1;
  const presentOrLate = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const lateCount = attendance.filter((a) => a.status === 'Late').length;
  const attendanceRate = (presentOrLate / totalAtt) * 100;
  const punctualityRate = ((presentOrLate - lateCount) / totalAtt) * 100;

  // Task completion on time
  const tasks = await prisma.teamTask.findMany({
    where: { assigneeId: tid, createdAt: { gte: since } },
  });
  const completedTasks = tasks.filter((t) => t.status === 'Done');
  const onTimeTasks = completedTasks.filter((t) => t.dueDate && t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate));
  const taskCompletionRate = tasks.length ? (completedTasks.length / tasks.length) * 100 : 70;
  const onTimeRate = completedTasks.length ? (onTimeTasks.length / completedTasks.length) * 100 : 70;

  // Objective progress (avg)
  const objectives = await prisma.objective.findMany({ where: { userId: tid } });
  const avgObjective = objectives.length ? objectives.reduce((s: number, o) => s + (o.progress || 0), 0) / objectives.length : 60;

  // Review scores
  const reviewScores = await prisma.reviewScore.findMany({ where: { userId: tid } });
  const avgReview = reviewScores.length ? reviewScores.reduce((s: number, r) => s + (r.rating || 0), 0) / reviewScores.length : 3;

  const score = Math.round(
    attendanceRate * 0.25 +
    punctualityRate * 0.10 +
    taskCompletionRate * 0.20 +
    onTimeRate * 0.15 +
    avgObjective * 0.20 +
    (avgReview / 5) * 100 * 0.10
  );

  let tier = 'Developing';
  if (score >= 85) tier = 'Promotion Ready';
  else if (score >= 70) tier = 'Strong';
  else if (score >= 55) tier = 'On Track';

  return {
    score: Math.min(100, score),
    tier,
    metrics: {
      attendanceRate: Math.round(attendanceRate),
      punctualityRate: Math.round(punctualityRate),
      taskCompletionRate: Math.round(taskCompletionRate),
      onTimeRate: Math.round(onTimeRate),
      avgObjective: Math.round(avgObjective),
      avgReview: Number(avgReview.toFixed(1)),
    },
  };
}

/**
 * reviews.getMine — DETERMINISTIC.
 * Reads real ReviewScore rows (one per dimension) instead of synthesizing
 * random radar values. Returns averaged scores per dimension across all the
 * user's reviews.
 */
export async function getMyReviews(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return { reviews: [], scores: [] };
  const reviews = await prisma.review.findMany({
    where: { userId }, include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' },
  });
  const scores = await prisma.reviewScore.findMany({
    where: { userId }, select: { dimension: true, rating: true },
  });
  const byDimension: Record<string, number[]> = {};
  for (const s of scores) {
    (byDimension[s.dimension] ||= []).push(s.rating);
  }
  const radar = Object.entries(byDimension).map(([subject, ratings]) => {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const val = Math.min(5, Math.max(1, Math.round(avg)));
    return { subject, A: val, B: val, fullMark: 5 };
  });
  return {
    reviews: reviews.map((r) => ({
      id: r.id, reviewPeriod: r.reviewPeriod, rating: r.rating, comments: r.comments,
      reviewerName: r.reviewer?.name || 'Manager',
    })),
    scores: radar,
  };
}

// ── Performance Calibration (P8) ──
interface CalibrationSessionRow {
  id: string;
  label: string;
  reviewPeriod: string;
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { name: string };
  entries: Array<{
    id: string;
    sessionId: string;
    reviewId: string;
    userId: string;
    rawScore: number;
    calibratedScore: number;
    multiplier: number;
    note: string | null;
    createdAt: Date;
    user: { name: string; department: string | null };
  }>;
}

interface CalibrationEntryRow {
  id: string;
  sessionId: string;
  reviewId: string;
  userId: string;
  rawScore: number;
  calibratedScore: number;
  multiplier: number;
  note: string | null;
  createdAt: Date;
  user: { name: string; department: string | null };
}

export async function getCalibrationSessions(caller: Caller | null): Promise<CalibrationSessionRow[]> {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  return prisma.calibrationSession.findMany({
    include: { createdBy: { select: { name: true } }, entries: { include: { user: { select: { name: true, department: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCalibrationEntries(caller: Caller | null, sessionId: string): Promise<CalibrationEntryRow[]> {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  return prisma.calibrationEntry.findMany({
    where: { sessionId },
    include: { user: { select: { name: true, department: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

// ───────────────────────────────────────────────────────────────────────────
// BENEFITS / EQUITY
// ───────────────────────────────────────────────────────────────────────────

export async function getEmployeeBenefits(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return [];
  const enrollments = await prisma.benefitEnrollment.findMany({ where: { userId }, include: { benefit: true } });
  return enrollments.map((e) => ({ id: e.id, status: e.status, benefit: e.benefit }));
}

export async function getEquityGrants(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return [];
  return prisma.equityGrant.findMany({ where: { userId } });
}

export async function getActiveEnrollmentPeriod() {
  const now = new Date();
  return prisma.enrollmentPeriod.findFirst({ where: { startDate: { lte: now }, endDate: { gte: now } }, orderBy: { endDate: 'asc' } });
}

// ───────────────────────────────────────────────────────────────────────────
// RECOGNITION / FEEDBACK / DOCUMENTS / COMPLIANCE / RECRUITMENT / DEI
// ───────────────────────────────────────────────────────────────────────────

export async function getRecentKudos(): Promise<{ id: string; message: string; category: string; receiverName: string; senderName: string; senderAvatar: string | null; createdAt: Date }[]> {
  const kudos = await prisma.kudo.findMany({
    include: { sender: { select: { name: true, avatarUrl: true } }, receiver: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }, take: 30,
  });
  return kudos.map((k) => ({
    id: k.id, message: k.message, category: k.category || 'Appreciation',
    senderName: k.sender?.name || 'Anonymous', senderAvatar: k.sender?.avatarUrl || null,
    receiverName: k.receiver?.name || 'Team', createdAt: k.createdAt,
  }));
}

/** Leaderboard: top kudo recipients across the org. */
export async function getKudoLeaderboard(): Promise<{ userId: string; name: string; avatarUrl: string | null; count: number }[]> {
  const agg = await prisma.kudo.groupBy({
    by: ['receiverId'],
    _count: { _all: true },
    orderBy: { _count: { receiverId: 'desc' } },
    take: 5,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: agg.map((a) => a.receiverId) } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return agg.map((a) => ({
    userId: a.receiverId,
    count: a._count._all,
    name: byId[a.receiverId]?.name || 'Unknown',
    avatarUrl: byId[a.receiverId]?.avatarUrl || null,
  }));
}

export async function getAllFeedback(caller: Caller | null) {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  const fb = await prisma.feedback.findMany({ include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  return fb.map((f) => ({
    id: f.id, content: f.content, type: f.type, status: f.status, anonymous: f.anonymous,
    authorName: f.anonymous ? 'Anonymous' : (f.author?.name || 'Anonymous'), createdAt: f.createdAt,
  }));
}

export async function getDocuments(caller: Caller | null, targetId?: string) {
  const userId = caller?.id;
  if (!userId) return [];
  const tid = targetId || userId;
  if (tid !== userId && !caller?.isAdmin && !caller?.isCEO) return [];
  return prisma.document.findMany({ where: { ownerId: tid }, orderBy: { createdAt: 'desc' } });
}

export async function getMyCertifications(caller: Caller | null): Promise<{ id: string; name: string; expiryDate: Date; userId: string; createdAt: Date }[]> {
  const userId = caller?.id;
  if (!userId) return [];
  return prisma.certification.findMany({ where: { userId }, orderBy: { expiryDate: 'asc' } });
}

export async function getExpiringCertifications(caller: Caller | null): Promise<{ id: string; name: string; expiryDate: Date; userId: string; createdAt: Date; user?: { name: string; department: string | null } }[]> {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  const now = new Date();
  const soon = new Date(); soon.setDate(now.getDate() + 30);
  return prisma.certification.findMany({
    where: { expiryDate: { gte: now, lte: soon } },
    include: { user: { select: { name: true, department: true } } },
    orderBy: { expiryDate: 'asc' },
  });
}

export async function getWhistleblowerReports(caller: Caller | null): Promise<{ id: string; report: string; userId: string | null; status: string; assignedTo: string | null; resolution: string | null; createdAt: Date; updatedAt: Date }[]> {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  return prisma.whistleblowerReport.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getCommitteeMembers() {
  return prisma.committeeMember.findMany({ orderBy: [{ isChair: 'desc' }, { role: 'asc' }] });
}

export async function getJobs(caller: Caller | null): Promise<{ id: string; title: string; department: string; location: string; type: string; status: string; requiredSkills: string | null; description: string | null; candidates: { id: string; name: string; email: string; status: string }[] }[]> {
  if (!caller?.isAdmin && !caller?.isCEO) return [];
  const jobs = await prisma.jobRequisition.findMany({ include: { candidates: true }, orderBy: { createdAt: 'desc' } });
  return jobs.map((j) => ({
    id: j.id, title: j.title, department: j.department, location: j.location, type: j.type,
    status: j.status, requiredSkills: j.requiredSkills, description: j.description,
    candidates: j.candidates.map((c) => ({ id: c.id, name: c.name, email: c.email, status: c.status })),
  }));
}

export async function getBiasAudit(caller: Caller | null) {
  if (!caller?.isAdmin && !caller?.isCEO) return { analysis: [], overallAvgSalary: 0 };
  const users = await prisma.user.findMany({
    where: { baseSalary: { not: null }, department: { not: null } },
    select: { department: true, baseSalary: true },
  });
  const groups: Record<string, number[]> = {};
  for (const u of users) {
    const dept = u.department;
    if (!dept) continue;
    (groups[dept] ||= []).push(u.baseSalary!);
  }
  const allSalaries = users.map((u) => u.baseSalary).filter((s): s is number => s != null);
  const globalAvg = allSalaries.length ? allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length : 0;
  const analysis = Object.entries(groups).map(([dept, salaries]) => {
    const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    const deviation = globalAvg ? (avg / globalAvg - 1) * 100 : 0;
    return { group: dept, headcount: salaries.length, avgSalary: Math.round(avg), deviation: Number(deviation.toFixed(1)), biasFlag: Math.abs(deviation) > 20 };
  });
  return { analysis, overallAvgSalary: Math.round(globalAvg) };
}

// ───────────────────────────────────────────────────────────────────────────
// PROFILE
// ───────────────────────────────────────────────────────────────────────────

export async function getSkills(caller: Caller | null, targetId?: string): Promise<{ id: string; userId: string; skill: string; level: number }[]> {
  const userId = caller?.id;
  if (!userId) return [];
  const tid = targetId || userId;
  if (tid !== userId && !caller?.isAdmin && !caller?.isCEO) return [];
  return prisma.skill.findMany({ where: { userId: tid } });
}

// ───────────────────────────────────────────────────────────────────────────
// PRESENCE
// ───────────────────────────────────────────────────────────────────────────

export async function getActivePresence() {
  const since = new Date(Date.now() - 5 * 60 * 1000);
  return prisma.user.findMany({
    where: { lastSeen: { gte: since }, status: 'active' },
    select: { id: true, name: true, lastSeen: true, avatarUrl: true, department: true },
  });
}

/**
 * Scope-limited live presence for the presence grid. Admins/HR/CEO/owners and
 * managers see org-wide presence; regular employees see only themselves and
 * their direct reports.
 */
export async function getActivePresenceScoped(caller: Caller | null) {
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const privileged =
    !!caller && (caller.isAdmin || caller.isCEO || caller.role === 'Manager' || caller.role === 'Director');
  if (privileged) {
    return getActivePresence();
  }
  if (!caller) return [];
  const ids = [caller.id, ...(await prisma.user.findMany({
    where: { managerId: caller.id },
    select: { id: true },
  })).map((u) => u.id)];
  return prisma.user.findMany({
    where: { id: { in: ids }, lastSeen: { gte: since }, status: 'active' },
    select: { id: true, name: true, lastSeen: true, avatarUrl: true, department: true },
  });
}

export async function getEngagementRecent() {
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, createdAt: true, designation: true },
  });
  return recentUsers.map((u) => ({ name: u.name, type: 'New Hire', date: u.createdAt }));
}

/**
 * Engagement greetings feed (P10).
 * Returns the active greeting rules, recent greeting history (last 30 days), and
 * upcoming birthdays / work anniversaries in the next 30 days (derived from
 * User.dateOfBirth / User.joinDate — same source the calendar uses).
 */
export async function getEngagementGreetings(caller: Caller | null) {
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;

  const rules = await prisma.greetingRule.findMany({ orderBy: { kind: 'asc' } });

  const since = new Date(); since.setDate(since.getDate() - 30);
  const history = await prisma.greetingLog.findMany({
    where: { sentAt: { gte: since } },
    orderBy: { sentAt: 'desc' },
    take: 50,
  });

  const now = new Date();
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const users = await prisma.user.findMany({
    where: { status: 'active', OR: [{ dateOfBirth: { not: null } }, { joinDate: { not: null } }] },
    select: { id: true, name: true, dateOfBirth: true, joinDate: true, avatarUrl: true },
  });

  const upcoming: Array<{ id: string; name: string; kind: 'birthday' | 'anniversary'; date: Date; tenureYears?: number; avatarUrl?: string | null }> = [];
  for (const u of users) {
    if (u.dateOfBirth) {
      const dob = new Date(u.dateOfBirth);
      const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (next >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && next <= in30) {
        upcoming.push({ id: `bday-${u.id}`, name: u.name, kind: 'birthday', date: next, avatarUrl: u.avatarUrl });
      }
    }
    if (u.joinDate) {
      const jd = new Date(u.joinDate);
      const next = new Date(now.getFullYear(), jd.getMonth(), jd.getDate());
      if (next >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && next <= in30) {
        upcoming.push({ id: `ann-${u.id}`, name: u.name, kind: 'anniversary', date: next, tenureYears: now.getFullYear() - jd.getFullYear(), avatarUrl: u.avatarUrl });
      }
    }
  }
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    rules: isAdmin || isCEO ? rules : [],
    history: isAdmin || isCEO ? history : [],
    upcoming,
    canManage: isAdmin || isCEO,
  };
}

/**
 * SprintHeatmap source — real activity intensity per day for the last 364 days
 * for the current user (attendance check-ins + tasks completed + events owned).
 * Returns an array of 364 numbers (0-4) used to color the heatmap.
 */
export async function getActivityHeatmap(caller: Caller | null) {
  const userId = caller?.id;
  if (!userId) return Array<number>(364).fill(0);
  const days = 364;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - (days - 1));

  const [attendance, tasks, events] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId, date: { gte: start } },
      select: { date: true },
    }),
    prisma.teamTask.findMany({
      where: { assigneeId: userId, status: 'Done', completedAt: { gte: start } },
      select: { completedAt: true },
    }),
    prisma.calendarEvent.findMany({
      where: { OR: [{ creatorId: userId }, { assigneeId: userId }], date: { gte: start } },
      select: { date: true },
    }),
  ]);

  const counts = new Map<number, number>();
  const bucket = (d: Date) => {
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const idx = Math.floor((day.getTime() - start.getTime()) / 86400000);
    if (idx >= 0 && idx < days) counts.set(idx, (counts.get(idx) || 0) + 1);
  };
  attendance.forEach((a) => bucket(a.date));
  tasks.forEach((t) => t.completedAt && bucket(t.completedAt));
  events.forEach((e) => bucket(e.date));

  return Array.from({ length: days }, (_, i) => {
    const c = counts.get(i) || 0;
    if (c <= 0) return 0;
    if (c === 1) return 1;
    if (c === 2) return 2;
    if (c <= 4) return 3;
    return 4;
  });
}

// ───────────────────────────────────────────────────────────────────────────
// MULTI-BRANCH
// ───────────────────────────────────────────────────────────────────────────

export const getBranches = unstable_cache(
  () => prisma.branch.findMany({ orderBy: { name: 'asc' } }),
  ['branches'],
  { revalidate: 300, tags: ['branches'] }
);

/** Reads the admin's selected branch from the `ems_branch` cookie (server-side). */
export async function getSelectedBranchId(): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const value = (await cookies()).get('ems_branch')?.value;
  return value && value !== 'all' ? value : null;
}

/**
 * Multi-tenancy (SaaS) — resolves the active tenant from the authenticated
 * caller.
 *
 * Returns `caller?.tenantId` (or `null` in single-tenant deployments), which
 * keeps every query's behaviour identical to before. Activate by adding
 * `Tenant` rows and setting `User.tenantId`, then run `prisma db push`.
 *
 * IMPORTANT: this variant must NOT read `cookies()` (a dynamic data source).
 * It is intentionally caller-only so it can be called from inside functions
 * wrapped with `unstable_cache` (Next.js forbids `cookies()` inside a cache
 * scope). The cookie-based override lives in `getSelectedTenantIdFromCookie`,
 * which must only be called OUTSIDE a cached scope (e.g. server components /
 * route handlers that resolve the tenant without a caller).
 */
export function getSelectedTenantId(caller?: Caller | null): string | null {
  return caller?.tenantId ?? null;
}

/**
 * Cookie-based tenant override (`ems_tenant`), resolved outside any
 * `unstable_cache` scope. Use only where the caller isn't available (or to
 * honour an explicit org switch). Never call this from a cached query path.
 */
export async function getSelectedTenantIdFromCookie(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookie = (await cookies()).get('ems_tenant')?.value;
    if (cookie && cookie !== 'all') return cookie;
  } catch {
    // Not in a request scope (e.g. background job) — fall back to null.
  }
  return null;
}

/**
 * Returns a Prisma `where` fragment that scopes a query to the active tenant,
 * or `{}` when no tenant is active (single-tenant). Use for models that carry a
 * direct `tenantId` (User, Branch) — for user-related models pass the result
 * inside `{ user: ... }` exactly like the existing `userBranch` pattern.
 *
 *   prisma.user.count({ where: { ...tenantWhere } })
 *   prisma.payroll.aggregate({ where: { ...userBranch, ...tenantUserWhere } })
 */
export function tenantWhere(caller?: Caller | null): Record<string, unknown> {
  const tenantId = getSelectedTenantId(caller);
  return tenantId ? { tenantId } : {};
}

/** Tenant-aware `user`-relation fragment (for payroll/expense/leave/etc.). */
export function tenantUserWhere(caller?: Caller | null): Record<string, unknown> {
  const tenantId = getSelectedTenantId(caller);
  return tenantId ? { user: { tenantId } } : {};
}

// ───────────────────────────────────────────────────────────────────────────
// CONVENIENCE WRAPPERS — resolve the caller themselves (for route handlers / SCs)
// ───────────────────────────────────────────────────────────────────────────

export const q = {
  dashboard: () => getCaller().then((c) => getDashboardStats(c)),
  myOverview: () => getCaller().then((c) => getDashboardMyOverview(c)),
  employees: getEmployees,
  orgTree: getOrgTree,
  myTeam: () => getCaller().then((c) => getMyTeam(c)),
  chainOfCommand: () => getCaller().then((c) => getChainOfCommand(c)),
  teamTasks: () => getCaller().then((c) => getTeamTasks(c)),
  teamPerformance: () => getCaller().then((c) => getTeamPerformance(c)),
  attendanceLogs: () => getCaller().then((c) => getAttendanceLogs(c)),
  attendanceAdminStats: getAttendanceAdminStats,
  leaveRequests: () => getCaller().then((c) => getLeaveRequests(c)),
  leaveBalance: () => getCaller().then((c) => getLeaveBalance(c)),
  payrolls: () => getCaller().then((c) => getPayrolls(c)),
  salaryHeads: getSalaryHeads,
  payrollAdminStats: getPayrollAdminStats,
  payments: () => getCaller().then((c) => getPaymentsForUser(c)),
  sales: () => getCaller().then((c) => getSalesForUser(c)),
  expenses: () => getCaller().then((c) => getExpenses(c)),
  penalties: () => getCaller().then((c) => getPenalties(c)),
  assets: getAssets,
  tickets: () => getCaller().then((c) => getTickets(c)),
  applications: getApplications,
  departments: getDepartments,
  auditLogs: getAuditLogs,
  news: () => getCaller().then((c) => getNews(c)),
  calendarEvents: () => getCaller().then((c) => getCalendarEvents(c)),
  shifts: getShifts,
  objectives: (targetId?: string) => getCaller().then((c) => getObjectives(c, targetId)),
  reviews: (targetId?: string) => getCaller().then((c) => getReviews(c, targetId)),
  promotionReadiness: () => getCaller().then((c) => getPromotionReadiness(c)),
  myReviews: () => getCaller().then((c) => getMyReviews(c)),
  employeeBenefits: () => getCaller().then((c) => getEmployeeBenefits(c)),
  equityGrants: () => getCaller().then((c) => getEquityGrants(c)),
  activeEnrollmentPeriod: getActiveEnrollmentPeriod,
  recentKudos: getRecentKudos,
  kudoLeaderboard: getKudoLeaderboard,
  allFeedback: () => getCaller().then((c) => getAllFeedback(c)),
  documents: (targetId?: string) => getCaller().then((c) => getDocuments(c, targetId)),
  myCertifications: () => getCaller().then((c) => getMyCertifications(c)),
  expiringCertifications: () => getCaller().then((c) => getExpiringCertifications(c)),
  whistleblowerReports: () => getCaller().then((c) => getWhistleblowerReports(c)),
  committeeMembers: getCommitteeMembers,
  jobs: () => getCaller().then((c) => getJobs(c)),
  biasAudit: () => getCaller().then((c) => getBiasAudit(c)),
  skills: (targetId?: string) => getCaller().then((c) => getSkills(c, targetId)),
  activePresence: getActivePresence,
  engagementRecent: getEngagementRecent,
  engagementGreetings: () => getCaller().then((c) => getEngagementGreetings(c)),
  trainingCatalog: () => getCaller().then((c) => getTrainingCatalog(c)),
  myTraining: () => getCaller().then((c) => getMyTraining(c)),
  trainingCompliance: () => getCaller().then((c) => getTrainingCompliance(c)),
  calibrationSessions: () => getCaller().then((c) => getCalibrationSessions(c)),
  calibrationEntries: (sessionId: string) => getCaller().then((c) => getCalibrationEntries(c, sessionId)),
  branches: getBranches,
};
