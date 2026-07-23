'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { logError } from '@/lib/logger';
import { MutationError, classifyError } from '@/lib/mutation-error';
import { runAutomationRules } from '@/server/automation';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';
import { canModifyUser } from '@/lib/hierarchy';
import { getCaller, type Caller } from '@/lib/auth';
import { calculatePayroll } from '@/lib/payroll';
import { estimateProvidentFund, estimateFestivalBonus, estimateGratuity } from '@/lib/bdStatutory';
import { computeAttendance } from '@/lib/attendance';
import { computeBdLeaveBalance } from '@/server/leaveBalance';
import { parseServerAction, ValidationError, BatchSchema } from '@/lib/validation';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Helper: check if user can manage news
function canManageNews(caller: Caller | null, newsAuthorId: string): boolean {
  if (!caller) return false;
  const isAdminOrHR = caller.isAdmin;
  const isAuthor = caller.id === newsAuthorId;
  return caller.isCEO || isAdminOrHR || isAuthor;
}

// Helper: check if user can create news
function canCreateNews(caller: Caller | null): boolean {
  if (!caller) return false;
  const isManager = caller.role === 'Manager';
  return caller.isCEO || caller.isAdmin || isManager;
}

// Tenant scoping for the server-action dispatcher. When a deployment is
// multi-tenant and the caller carries a `tenantId`, every privileged read of
// tenant-scoped models MUST be restricted to that tenant. In single-tenant
// deployments `caller.tenantId` is null, so this returns `{}` and behaviour is
// unchanged (backward-compatible, zero regression). This guards the bulk of the
// UI's API surface (`runQuery`) which previously applied no tenant filter.
function callerTenantWhere(caller: Caller | null): { tenantId: string } | Record<string, never> {
  const tenantId = caller?.tenantId ?? null;
  return tenantId ? { tenantId } : {};
}

function withTenantUserScope(caller: Caller | null): Record<string, unknown> {
  const tenantId = caller?.tenantId ?? null;
  return tenantId ? { user: { tenantId } } : {};
}

function mergeWhere<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T {
  if (Object.keys(extra).length === 0) return base;
  return { ...base, ...extra };
}

// Resolve a leave request's `type` string to its canonical LeaveType.category.
// Cached per call to avoid N+1; callers pass the resolved category.
const leaveCategoryCache = new Map<string, string | null>();
async function resolveLeaveCategory(type: string): Promise<string | null> {
  if (leaveCategoryCache.has(type)) return leaveCategoryCache.get(type)!;
  const lt = await prisma.leaveType.findFirst({ where: { name: type } });
  const category = lt?.category ?? null;
  leaveCategoryCache.set(type, category);
  return category;
}

// Years of continuous service from the user's creation date (for gratuity).
function yearsOfService(user: { createdAt?: Date | null }): number {
  if (!user.createdAt) return 0;
  const ms = Date.now() - new Date(user.createdAt).getTime();
  return ms / (1000 * 60 * 60 * 24 * 365);
}

/**
 * Resolve the caller once and run a single query through `runQuery`.
 */
export async function executeServerQuery(path: string, args?: any) {
  const parsed = parseServerAction(path, args);
  path = parsed.path;
  args = parsed.args;

  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;
  return runQuery(caller, isAdmin, isCEO, userId, path, args);
}

/**
 * Batched query entry point. Accepts an array of `{ path, args }` pairs and
 * resolves them in parallel inside a single server-action call, so complex
 * dashboards fire ONE round-trip instead of N waterfalls. Each entry keeps its
 * own result slot; a single failing query does not fail the whole batch
 * (it returns `{ ok: false, error }` for that slot so the client can render
 * partial UI).
 */
export async function executeServerBatch(
  queries: { path: string; args?: unknown }[],
): Promise<{ ok: boolean; data?: unknown; error?: string }[]> {
  const parsed = BatchSchema.safeParse(queries);
  if (!parsed.success) {
    throw new ValidationError('Invalid batch: ' + parsed.error.issues[0]?.message);
  }

  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const userId = caller?.id;

  return Promise.all(
    parsed.data.map(async (q) => {
      try {
        const data = await runQuery(caller, isAdmin, isCEO, userId, q.path, q.args);
        return { ok: true, data };
      } catch (err: any) {
        return { ok: false, error: err?.message ?? 'Query failed' };
      }
    }),
  );
}

/**
 * Internal dispatch used by both `executeServerQuery` and `executeServerBatch`.
 * The caller context is resolved once and passed in so a batched request only
 * authenticates once instead of per query.
 */
export async function runQuery(
  caller: Caller | null,
  isAdmin: boolean,
  isCEO: boolean,
  userId: string | undefined,
  path: string,
  args?: any,
) {
  try {
    // Tenant scope for org-wide privileged reads below. No-op in single-tenant.
    const tenantWhere = callerTenantWhere(caller);
    // ── DASHBOARD (Enhanced) ──
    if (path === 'dashboard.getStats') {
      const headcount = await prisma.user.count({ where: tenantWhere });
      const pendingApps = await prisma.leaveRequest.count({ where: mergeWhere({ status: 'Pending' }, withTenantUserScope(caller)) });
      const totalPayrollResult = await prisma.payroll.aggregate({ where: withTenantUserScope(caller), _sum: { totalAmount: true } });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const presentToday = await prisma.attendance.count({ where: mergeWhere({ date: { gte: today } }, withTenantUserScope(caller)) });
      const activeToday = headcount > 0 ? `${Math.round((presentToday / headcount) * 100)}%` : '0%';
      return { headcount, pendingApps, activeToday, totalPayroll: totalPayrollResult._sum.totalAmount || 0 };
    }

    if (path === 'dashboard.getFullStats') {
      const headcount = await prisma.user.count({ where: tenantWhere });
      const pendingLeaves = await prisma.leaveRequest.count({ where: mergeWhere({ status: 'Pending' }, withTenantUserScope(caller)) });
      const approvedLeaves = await prisma.leaveRequest.count({ where: mergeWhere({ status: 'Approved' }, withTenantUserScope(caller)) });
      const rejectedLeaves = await prisma.leaveRequest.count({ where: mergeWhere({ status: 'Rejected' }, withTenantUserScope(caller)) });
      const totalPayrollResult = await prisma.payroll.aggregate({ where: withTenantUserScope(caller), _sum: { totalAmount: true } });
      const totalExpenseResult = await prisma.expense.aggregate({ where: mergeWhere({}, withTenantUserScope(caller)), _sum: { amount: true } });
      const pendingExpenses = await prisma.expense.count({ where: mergeWhere({ status: 'PENDING' }, withTenantUserScope(caller)) });
      const openTickets = await prisma.ticket.count({ where: mergeWhere({ status: 'Open' }, withTenantUserScope(caller)) });

      // Attendance for the last 7 days
      const attendanceTrend = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = await prisma.attendance.count({
          where: mergeWhere({ date: { gte: day, lt: nextDay } }, withTenantUserScope(caller))
        });
        attendanceTrend.push({
          day: day.toLocaleDateString('en', { weekday: 'short' }),
          date: day.toISOString(),
          present: count,
          rate: headcount > 0 ? Math.round((count / headcount) * 100) : 0
        });
      }

      // Department breakdown
      const allUsers = await prisma.user.findMany({ where: tenantWhere, select: { department: true } });
      const deptMap: Record<string, number> = {};
      allUsers.forEach(u => {
        const dept = u.department || 'Unassigned';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      const departmentBreakdown = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

      // Leave breakdown by type
      const allLeaves = await prisma.leaveRequest.findMany({ where: withTenantUserScope(caller), select: { type: true } });
      const leaveTypeMap: Record<string, number> = {};
      allLeaves.forEach(l => {
        leaveTypeMap[l.type] = (leaveTypeMap[l.type] || 0) + 1;
      });
      const leaveBreakdown = Object.entries(leaveTypeMap).map(([type, count]) => ({ type, count }));

      // Task stats
      const totalTasks = await prisma.teamTask.count({ where: withTenantUserScope(caller) });
      const doneTasks = await prisma.teamTask.count({ where: mergeWhere({ status: 'Done' }, withTenantUserScope(caller)) });
      const inProgressTasks = await prisma.teamTask.count({ where: mergeWhere({ status: 'InProgress' }, withTenantUserScope(caller)) });
      const blockedTasks = await prisma.teamTask.count({ where: mergeWhere({ status: 'Blocked' }, withTenantUserScope(caller)) });

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentHires = await prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, ...tenantWhere },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, department: true, designation: true, createdAt: true }
      });

      // Upcoming events
      const upcomingEvents = await prisma.calendarEvent.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 5,
        select: { title: true, date: true, type: true }
      });

      // Recent news
      const recentNews = await prisma.companyNews.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { title: true, priority: true, createdAt: true, authorName: true }
      });

      // Expense breakdown by category
      const allExpenses = await prisma.expense.findMany({ where: withTenantUserScope(caller), select: { category: true, amount: true, status: true } });
      const expenseCatMap: Record<string, number> = {};
      allExpenses.forEach(e => {
        expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
      });
      const expenseBreakdown = Object.entries(expenseCatMap).map(([category, amount]) => ({ category, amount: Math.round(amount) }));

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const presentToday = await prisma.attendance.count({ where: mergeWhere({ date: { gte: today } }, withTenantUserScope(caller)) });
      const attendanceRate = headcount > 0 ? Math.round((presentToday / headcount) * 100) : 0;

      return {
        headcount,
        attendanceRate,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        totalPayroll: totalPayrollResult._sum.totalAmount || 0,
        totalExpenses: totalExpenseResult._sum.amount || 0,
        pendingExpenses,
        openTickets,
        attendanceTrend,
        departmentBreakdown,
        leaveBreakdown,
        expenseBreakdown,
        totalTasks,
        doneTasks,
        inProgressTasks,
        blockedTasks,
        recentHires,
        upcomingEvents,
        recentNews
      };
    }

    if (path === 'dashboard.getMyOverview') {
      if (!userId) return null;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const myAttendance = await prisma.attendance.count({ where: { userId, date: { gte: thirtyDaysAgo } } });
      const workDays = 22; // approximate working days in a month
      const attendancePercent = Math.min(100, Math.round((myAttendance / workDays) * 100));

      const myPendingLeaves = await prisma.leaveRequest.count({ where: { userId, status: 'Pending' } });
      const myApprovedLeaves = await prisma.leaveRequest.count({ where: { userId, status: 'Approved' } });

      const myTotalTasks = await prisma.teamTask.count({ where: { assigneeId: userId } });
      const myDoneTasks = await prisma.teamTask.count({ where: { assigneeId: userId, status: 'Done' } });
      const myInProgressTasks = await prisma.teamTask.count({ where: { assigneeId: userId, status: 'InProgress' } });
      const myPendingTasks = await prisma.teamTask.count({ where: { assigneeId: userId, status: 'ToDo' } });

      const myRecentPayrolls = await prisma.payroll.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { month: true, year: true, totalAmount: true, status: true }
      });

      const myUpcomingEvents = await prisma.calendarEvent.findMany({
        where: {
          date: { gte: new Date() },
          OR: [
            { assigneeId: userId },
            { creatorId: userId },
            { targetTeam: caller?.department || '' },
            { targetTeam: null }
          ]
        },
        orderBy: { date: 'asc' },
        take: 5,
        select: { title: true, date: true, type: true, status: true }
      });

      return {
        attendancePercent,
        myPendingLeaves,
        myApprovedLeaves,
        myTotalTasks,
        myDoneTasks,
        myInProgressTasks,
        myPendingTasks,
        myRecentPayrolls,
        myUpcomingEvents
      };
    }

    // ── REGISTRY ──
    if (path === 'registry.getAll' || path === 'registry.searchEmployees') {
      return await prisma.user.findMany({
        where: callerTenantWhere(caller),
        select: {
          id: true, name: true, email: true, role: true,
          department: true, designation: true, avatarUrl: true,
          status: true, isOnboarded: true, managerId: true,
          manager: { select: { id: true, name: true, role: true } },
        },
        orderBy: { name: 'asc' },
      });
    }

    // ── ORG CHART ──
    if (path === 'orgchart.getOrgData' || path === 'orgchart.getTree' || path === 'team.getOrgChart') {
      const users = await prisma.user.findMany({
        where: callerTenantWhere(caller),
        select: {
          id: true, name: true, email: true, role: true,
          department: true, designation: true, avatarUrl: true,
          managerId: true, status: true, isOnboarded: true,
        },
      });
      // Build tree from flat list
      const userMap: any = {};
      users.forEach(u => userMap[u.id] = { ...u, children: [] });
      let root: any = null;
      
      const isDescendant = (nodeId: string, potentialAncestorId: string): boolean => {
        if (!nodeId || !userMap[nodeId]) return false;
        if (nodeId === potentialAncestorId) return true;
        for (const child of userMap[nodeId].children) {
          if (isDescendant(child.id, potentialAncestorId)) return true;
        }
        return false;
      };

      users.forEach(u => {
        if (u.managerId && userMap[u.managerId]) {
          // Prevent circular reference: Don't add u to manager's children if manager is already a descendant of u
          if (!isDescendant(u.id, u.managerId)) {
            userMap[u.managerId].children.push(userMap[u.id]);
          }
        } else if (!u.managerId) {
          // Prefer the org root by authoritative role, not free-text designation.
          const score = (r: string) => (r === 'CEO' ? 3 : r === 'Admin' ? 2 : r === 'Director' ? 1 : 0);
          if (!root || score(u.role) > score(root.role || '')) {
            root = userMap[u.id];
          }
        }
      });
      if (!root && users.length) {
        // Fallback: the node that ends up with the most descendants.
        let best = userMap[users[0].id];
        for (const u of users) {
          if (userMap[u.id].children.length > best.children.length) best = userMap[u.id];
        }
        root = best;
      }
      return root;
    }

    // ── TEAM (Enhanced - Chain of Command) ──
    if (path === 'team.getMyTeam') {
      if (isAdmin || isCEO) {
        const directReports = await prisma.user.findMany({ where: tenantWhere });
        return { teamId: 'all', directReports };
      }
      const directReports = await prisma.user.findMany({ where: { managerId: userId } });
      return { teamId: 'my_team', directReports };
    }

    if (path === 'team.getChainOfCommand') {
      if (!userId) return { chain: [], directReports: [], peers: [] };
      
      // Get upward chain (me → manager → manager's manager → ... → CEO)
      const chain: any[] = [];
      let currentUser: any = caller;
      const seenIds = new Set<string>();
      
      while (currentUser) {
        if (seenIds.has(currentUser.id)) break; // Prevent circular dependency infinite loop
        seenIds.add(currentUser.id);
        
        chain.unshift({
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          department: currentUser.department,
          designation: currentUser.designation,
          avatarUrl: currentUser.avatarUrl,
          email: currentUser.email
        });
        if (currentUser.managerId) {
          currentUser = await prisma.user.findUnique({ where: { id: currentUser.managerId } });
        } else {
          break;
        }
      }

      // Get direct reports
      const directReports = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true, name: true, role: true, department: true, designation: true, avatarUrl: true, email: true, status: true }
      });

      // Get peers (same manager)
      const peers = caller?.managerId
        ? await prisma.user.findMany({
            where: { managerId: caller.managerId, NOT: { id: userId } },
            select: { id: true, name: true, role: true, department: true, designation: true, avatarUrl: true }
          })
        : [];

      // Get reports of direct reports (2nd level)
      const secondLevelReports: any[] = [];
      for (const report of directReports) {
        const subReports = await prisma.user.findMany({
          where: { managerId: report.id },
          select: { id: true, name: true, role: true, department: true, designation: true, avatarUrl: true }
        });
        if (subReports.length > 0) {
          secondLevelReports.push({ managerId: report.id, managerName: report.name, reports: subReports });
        }
      }

      return { chain, directReports, peers, secondLevelReports };
    }

    if (path === 'team.getTeamTasks') {
      if (!userId) return [];
      
      // Managers see tasks they assigned + tasks assigned to them
      // Employees see tasks assigned to them
      if (isAdmin || isCEO) {
        return await prisma.teamTask.findMany({
          where: withTenantUserScope(caller),
          include: { assignee: { select: { id: true, name: true, avatarUrl: true, designation: true } }, assigner: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        });
      }
      
      const directReportIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map(u => u.id);
      
      return await prisma.teamTask.findMany({
        where: {
          OR: [
            { assigneeId: userId },
            { assignerId: userId },
            { assigneeId: { in: directReportIds } }
          ]
        },
        include: { assignee: { select: { id: true, name: true, avatarUrl: true, designation: true } }, assigner: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (path === 'team.getTeamPerformance') {
      if (!userId) return [];
      
      // Get team members (direct reports or peers)
      let memberIds: string[] = [];
      if (isAdmin || isCEO) {
        memberIds = (await prisma.user.findMany({ where: tenantWhere, select: { id: true } })).map(u => u.id);
      } else {
        memberIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map(u => u.id);
        memberIds.push(userId);
      }

      const performance = [];
      for (const memberId of memberIds.slice(0, 20)) { // Limit to 20 for performance
        const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, name: true, designation: true, department: true, avatarUrl: true } });
        if (!member) continue;

        const totalTasks = await prisma.teamTask.count({ where: { assigneeId: memberId } });
        const doneTasks = await prisma.teamTask.count({ where: { assigneeId: memberId, status: 'Done' } });
        const inProgressTasks = await prisma.teamTask.count({ where: { assigneeId: memberId, status: 'InProgress' } });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attendanceCount = await prisma.attendance.count({ where: { userId: memberId, date: { gte: thirtyDaysAgo } } });
        const attendanceRate = Math.min(100, Math.round((attendanceCount / 22) * 100));

        performance.push({
          ...member,
          totalTasks,
          doneTasks,
          inProgressTasks,
          completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
          attendanceRate
        });
      }

      return performance;
    }

    // ── ATTENDANCE ──
    if (path === 'attendance.getLogs') {
      if (isAdmin) {
        const logs = await prisma.attendance.findMany({ where: withTenantUserScope(caller), include: { user: true }, orderBy: { date: 'desc' }, take: 100 });
        return logs.map(l => ({ ...l, userName: l.user.name }));
      }
      const logs = await prisma.attendance.findMany({ where: { userId }, include: { user: true }, orderBy: { date: 'desc' }, take: 50 });
      return logs.map(l => ({ ...l, userName: l.user.name }));
    }
    if (path === 'attendance.getAdminStats') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const onShift = await prisma.attendance.count({ where: mergeWhere({ date: { gte: today }, clockOut: null }, withTenantUserScope(caller)) });
      const lateArrivals = await prisma.attendance.count({ where: mergeWhere({ date: { gte: today }, status: 'Late' }, withTenantUserScope(caller)) });
      const absent = await prisma.attendance.count({ where: mergeWhere({ date: { gte: today }, status: 'Absent' }, withTenantUserScope(caller)) });
      const totalEmployees = await prisma.user.count({ where: tenantWhere });
      return { onShift, lateArrivals, absent, totalEmployees };
    }

    // ── LEAVE ──
    if (path === 'leave.getRequests') {
      if (isAdmin) {
        return await prisma.leaveRequest.findMany({ where: withTenantUserScope(caller), include: { user: true }, orderBy: { createdAt: 'desc' } });
      }
      return await prisma.leaveRequest.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }

    // ── PAYROLL ──
    if (path === 'payroll.getPayrolls') {
      if (isAdmin) {
        return await prisma.payroll.findMany({ where: withTenantUserScope(caller), include: { user: true }, orderBy: { createdAt: 'desc' } });
      }
      return await prisma.payroll.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }
    if (path === 'payroll.getHeads') return await prisma.salaryHead.findMany();
    if (path === 'payroll.getStructures') return await prisma.salaryStructure.findMany({ orderBy: { createdAt: 'desc' } });
    if (path === 'payroll.getFestivalBonuses') {
      if (isAdmin || isCEO) {
        return await prisma.festivalBonus.findMany({ where: withTenantUserScope(caller), include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
      }
      return await prisma.festivalBonus.findMany({ where: { userId }, include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
    }
    if (path === 'payroll.getPayments') {
      if (isAdmin || isCEO) return await prisma.payment.findMany({ where: withTenantUserScope(caller), include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
      return await prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }
    if (path === 'payroll.getAdminStats') {
      const totalPayroll = await prisma.payroll.aggregate({ where: withTenantUserScope(caller), _sum: { totalAmount: true } });
      const employeeCount = await prisma.user.count({ where: tenantWhere });
      const lastRun = await prisma.payroll.findFirst({ where: withTenantUserScope(caller), orderBy: { createdAt: 'desc' } });
      return {
        totalYTD: totalPayroll._sum.totalAmount || 0,
        employeeCount,
        lastRunMonth: lastRun ? `${lastRun.month} ${lastRun.year}` : 'Never',
        lastRunStatus: lastRun?.status || 'N/A'
      };
    }

    // ── EXPENSES ──
    if (path === 'expenses.getAll' || path === 'expenses.getMyExpenses') {
      if (isAdmin) return await prisma.expense.findMany({ where: withTenantUserScope(caller), include: { user: true }, orderBy: { createdAt: 'desc' } });
      return await prisma.expense.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }
    if (path === 'expenses.getPenalties') {
      if (isAdmin) return await prisma.penalty.findMany({ where: withTenantUserScope(caller), include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
      return await prisma.penalty.findMany({ where: { userId }, include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: 'desc' } });
    }

    // ── ASSETS ──
    if (path === 'assets.getAssets') return await prisma.asset.findMany({ where: withTenantUserScope(caller), include: { user: true } });

    // ── HELPDESK ──
    if (path === 'helpdesk.getTickets') {
      if (isAdmin) return await prisma.ticket.findMany({ where: withTenantUserScope(caller), include: { user: true, replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
      return await prisma.ticket.findMany({ where: { userId }, include: { user: true, replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
    }

    // ── APPLICATIONS (Leave Requests for Admin) ──
    if (path === 'applications.list') {
      return await prisma.leaveRequest.findMany({ where: withTenantUserScope(caller), include: { user: true }, orderBy: { createdAt: 'desc' } });
    }

    // ── DEPARTMENTS ──
    if (path === 'departments.getDepartments') return await prisma.department.findMany();

    // ── BRANCHES ──
    if (path === 'branch.list') return await prisma.branch.findMany({ where: tenantWhere, orderBy: { name: 'asc' } });

    // ── AUDIT ──
    if (path === 'audit.getLogs') {
      const events = await prisma.event.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
      const tenantUsers = await prisma.user.findMany({ where: tenantWhere, select: { id: true, name: true, role: true } });
      const userMap = tenantUsers.reduce<Record<string, { id: string; name: string; role: string }>>((acc, u) => { acc[u.id] = u; return acc; }, {});
      return events
        .filter(e => userMap[e.actorId])
        .map(e => ({ ...e, actorName: userMap[e.actorId]?.name || 'System', actorRole: userMap[e.actorId]?.role || 'N/A' }));
    }

    // ── NOTIFICATIONS ──
    if (path === 'notifications.getAll') {
      if (!userId) return [];
      return await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    }

    // ── ENGAGEMENT (recent events) ──
    if (path === 'engagement.getRecent') {
      const recentUsers = await prisma.user.findMany({ where: tenantWhere, orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, createdAt: true, designation: true } });
      return recentUsers.map(u => ({ name: u.name, type: 'New Hire', date: u.createdAt }));
    }

    // ── COMPANY NEWS ──
    if (path === 'news.getAll' || path === 'announcements.getAll') {
      const news = await prisma.companyNews.findMany({
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: { author: { select: { id: true, name: true, role: true, designation: true } } }
      });
      // Filter: show universal news to everyone, team news only to that team
      return news.filter(n => {
        if (n.category === 'Universal' || !n.targetTeam) return true;
        if (n.category === 'Team' && n.targetTeam === caller?.department) return true;
        if (isAdmin || isCEO) return true; // Admins see everything
        return false;
      }).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        category: n.category,
        targetTeam: n.targetTeam,
        author: n.authorName,
        authorId: n.authorId,
        authorRole: n.author.role,
        authorDesignation: n.author.designation,
        isEdited: n.isEdited,
        isPinned: n.isPinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        canEdit: canManageNews(caller, n.authorId),
        canDelete: canManageNews(caller, n.authorId)
      }));
    }

    // ── CALENDAR EVENTS ──
    if (path === 'calendar.getEvents') {
      const events = await prisma.calendarEvent.findMany({
        where: {
          OR: [
            { targetTeam: null }, // Global events
            { targetTeam: caller?.department || '' },
            { creatorId: userId || '' },
            { assigneeId: userId || '' }
          ]
        },
        include: {
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } }
        },
        orderBy: { date: 'asc' }
      });
      return events;
    }

    if (path === 'calendar.getMyReminders') {
      if (!userId) return [];
      return await prisma.calendarEvent.findMany({
        where: {
          OR: [
            { creatorId: userId, type: 'Reminder' },
            { assigneeId: userId }
          ],
          date: { gte: new Date() }
        },
        orderBy: { date: 'asc' },
        take: 20
      });
    }

    // ── SHIFTS ──
    if (path === 'shifts.getShifts') {
      let shifts = await prisma.shift.findMany({ orderBy: { name: 'asc' } });
      if (shifts.length === 0) {
        // Seed sensible default shifts on first access.
        shifts = await prisma.$transaction([
          prisma.shift.create({ data: { name: 'Morning', startTime: '06:00', endTime: '14:00', location: 'HQ Building' } }),
          prisma.shift.create({ data: { name: 'Day', startTime: '09:00', endTime: '17:00', location: 'HQ Building' } }),
          prisma.shift.create({ data: { name: 'Evening', startTime: '14:00', endTime: '22:00', location: 'HQ Building' } }),
          prisma.shift.create({ data: { name: 'Night', startTime: '22:00', endTime: '06:00', location: 'HQ Building' } }),
        ]);
      }
      return shifts;
    }
    if (path === 'shifts.getAssignments') {
      if (!isAdmin && !isCEO) return [];
      const dateStr = (args as any)?.date;
      const date = dateStr ? new Date(dateStr) : new Date();
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
      const assignments = await prisma.shiftAssignment.findMany({
        where: mergeWhere({ date: { gte: dayStart, lte: dayEnd } }, withTenantUserScope(caller)),
        include: { user: { select: { name: true, role: true, avatarUrl: true } }, shift: true, team: true },
        orderBy: { createdAt: 'asc' }
      });
      return assignments.map((a) => ({
        id: a.id,
        shiftId: a.shiftId,
        userId: a.userId,
        userName: a.user?.name || 'Unknown',
        userRole: a.user?.role || 'Staff',
        userAvatar: a.user?.avatarUrl || null,
        teamId: a.teamId || null,
        teamName: a.team?.name || null,
        workNote: a.workNote || null,
        roleOnShift: a.roleOnShift || null,
        date: a.date
      }));
    }
    if (path === 'shifts.getTeams') {
      if (!isAdmin && !isCEO) return [];
      return await prisma.team.findMany({
        where: withTenantUserScope(caller),
        orderBy: { name: 'asc' },
        include: { lead: { select: { name: true } }, branch: true },
      });
    }

    // ── PERFORMANCE ──
    if (path === 'performance.getObjectives') {
      if (!userId) return [];
      const targetId = (args as any)?.userId || userId;
      // Employees see only their own; managers/admins see the target's.
      if (targetId !== userId && !isAdmin && !isCEO) return [];
      return await prisma.objective.findMany({
        where: { userId: targetId },
        orderBy: { createdAt: 'desc' }
      });
    }
    if (path === 'performance.getReviews') {
      if (!userId) return [];
      const targetId = (args as any)?.userId || userId;
      if (targetId !== userId && !isAdmin && !isCEO) return [];
      return await prisma.review.findMany({
        where: { userId: targetId },
        include: { reviewer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }).then((reviews: any[]) => reviews.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        reviewPeriod: r.reviewPeriod,
        rating: r.rating,
        comments: r.comments,
        reviewerName: r.reviewer?.name || 'Manager'
      })));
    }

    // ── CALIBRATION / TRAINING / WHISTLEBLOWER / ENGAGEMENT (queries) ──
    if (path === 'calibration.getSessions') {
      if (!isAdmin && !isCEO) return [];
      return prisma.calibrationSession.findMany({
        where: { createdBy: { tenantId: caller?.tenantId ?? '' } },
        include: { createdBy: { select: { name: true } }, entries: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (path === 'calibration.getEntries') {
      if (!isAdmin && !isCEO) return [];
      const sessionId = (args as any)?.sessionId;
      if (!sessionId) return [];
      return prisma.calibrationEntry.findMany({
        where: { sessionId },
        include: { user: { select: { name: true, department: true } } },
        orderBy: { createdAt: 'asc' },
      });
    }
    if (path === 'training.catalog') {
      const courses = await prisma.trainingCourse.findMany({ where: { isActive: true }, orderBy: { category: 'asc' } });
      if (!userId) return courses.map((c: any) => ({ ...c, enrollment: null }));
      const enrollments = await prisma.trainingEnrollment.findMany({ where: { userId } });
      const byCourse = new Map(enrollments.map((e: any) => [e.courseId, e]));
      return courses.map((c: any) => ({ ...c, enrollment: byCourse.get(c.id) || null }));
    }
    if (path === 'training.myTraining') {
      if (!userId) return [];
      return prisma.trainingEnrollment.findMany({ where: { userId }, include: { course: true }, orderBy: { enrolledAt: 'desc' } });
    }
    if (path === 'whistleblower.reports') {
      if (!isAdmin && !isCEO) return [];
      return prisma.whistleblowerReport.findMany({ orderBy: { createdAt: 'desc' } });
    }
    if (path === 'committee.members') {
      return prisma.committeeMember.findMany({ orderBy: [{ isChair: 'desc' }, { role: 'asc' }] });
    }
    if (path === 'engagement.greetings') {
      const isPriv = isAdmin || isCEO;
      const rules = isPriv ? await prisma.greetingRule.findMany({ orderBy: { kind: 'asc' } }) : [];
      const since = new Date(); since.setDate(since.getDate() - 30);
      const history = isPriv ? await prisma.greetingLog.findMany({ where: { sentAt: { gte: since } }, orderBy: { sentAt: 'desc' }, take: 50 }) : [];
      const now = new Date();
      const in30 = new Date(); in30.setDate(in30.getDate() + 30);
      const users = await prisma.user.findMany({ where: mergeWhere({ status: 'active', OR: [{ dateOfBirth: { not: null } }, { joinDate: { not: null } }] }, tenantWhere), select: { id: true, name: true, dateOfBirth: true, joinDate: true, avatarUrl: true } });
      const upcoming: any[] = [];
      for (const u of users) {
        if (u.dateOfBirth) {
          const dob = new Date(u.dateOfBirth);
          const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
          if (next >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && next <= in30) upcoming.push({ id: `bday-${u.id}`, name: u.name, kind: 'birthday', date: next, avatarUrl: u.avatarUrl });
        }
        if (u.joinDate) {
          const jd = new Date(u.joinDate);
          const next = new Date(now.getFullYear(), jd.getMonth(), jd.getDate());
          if (next >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && next <= in30) upcoming.push({ id: `ann-${u.id}`, name: u.name, kind: 'anniversary', date: next, tenureYears: now.getFullYear() - jd.getFullYear(), avatarUrl: u.avatarUrl });
        }
      }
      upcoming.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { rules, history, upcoming, canManage: isPriv };
    }

    // ── REVIEWS (360 performance) ──
    if (path === 'reviews.getMine') {
      if (!userId) return [];
      const reviews = await prisma.review.findMany({
        where: { userId },
        include: { reviewer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      // Deterministic per-dimension scores read from ReviewScore rows
      // (no Math.random — analytics stay stable across renders).
      const scores = await prisma.reviewScore.findMany({
        where: { userId },
        select: { dimension: true, rating: true },
      });
      const byDimension: Record<string, number[]> = {};
      for (const s of scores) (byDimension[s.dimension] ||= []).push(s.rating);
      const radar = Object.entries(byDimension).map(([subject, ratings]) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const val = Math.min(5, Math.max(1, Math.round(avg)));
        return { subject, A: val, B: val, fullMark: 5 };
      });
      return { reviews, scores: radar };
    }

    // ── LEAVE BALANCE (BD Labour Act accrual) ──
    if (path === 'leave.getBalance') {
      if (!userId) return null;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const startYear = new Date(new Date().getFullYear(), 0, 1);
      const usedRows = await prisma.leaveRequest.findMany({
        where: { userId, status: 'Approved', startDate: { gte: startYear } },
        select: { type: true, days: true },
      });
      const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
      const typeToCategory = new Map(leaveTypes.map((lt) => [lt.name, lt.category]));
      const usedByCategory: Record<string, number> = {};
      for (const r of usedRows) {
        const category = typeToCategory.get(r.type) || r.type;
        usedByCategory[category] = (usedByCategory[category] || 0) + (r.days || 0);
      }
      return computeBdLeaveBalance({ createdAt: user?.createdAt, usedByCategory, gender: user?.gender });
    }

    // ── AUTOMATIONS ──
    if (path === 'automations.list') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      return await prisma.automationRule.findMany({
        where: { ownerId: userId! },
        orderBy: { createdAt: 'desc' }
      });
    }

    // ── PRESENCE (derived) ──
    if (path === 'presence.getActive') {
      const since = new Date(Date.now() - 5 * 60 * 1000); // 5 min window
      const active = await prisma.user.findMany({
        where: mergeWhere({ lastSeen: { gte: since }, status: 'active' }, tenantWhere),
        select: { id: true, name: true, lastSeen: true, avatarUrl: true, department: true }
      });
      return active;
    }

    // ── BENEFITS / EQUITY ──
    if (path === 'benefits.getEmployeeBenefits') {
      if (!userId) return [];
      const enrollments = await prisma.benefitEnrollment.findMany({
        where: { userId },
        include: { benefit: true }
      });
      return enrollments.map((e: any) => ({ id: e.id, status: e.status, benefit: e.benefit }));
    }
    if (path === 'benefits.getEquityGrants') {
      if (!userId) return [];
      return await prisma.equityGrant.findMany({ where: { userId } });
    }
    if (path === 'benefits.getActiveEnrollmentPeriod') {
      const now = new Date();
      return await prisma.enrollmentPeriod.findFirst({
        where: { startDate: { lte: now }, endDate: { gte: now } },
        orderBy: { endDate: 'asc' }
      });
    }

    // ── RECOGNITION ──
    if (path === 'recognition.getRecentKudos') {
      return await prisma.kudo.findMany({
        where: withTenantUserScope(caller),
        include: { sender: { select: { name: true, avatarUrl: true } }, receiver: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30
      }).then((kudos) => kudos.map((k) => ({
        id: k.id,
        message: k.message,
        senderName: k.sender?.name || 'Anonymous',
        senderAvatar: k.sender?.avatarUrl || null,
        receiverName: k.receiver?.name || 'Team',
        createdAt: k.createdAt
      })));
    }

    // ── FEEDBACK ──
    if (path === 'feedback.getAllFeedback') {
      if (!isAdmin && !isCEO) return [];
      return await prisma.feedback.findMany({
        where: withTenantUserScope(caller),
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }).then((fb) => fb.map((f) => ({
        id: f.id,
        content: f.content,
        type: f.type,
        status: f.status,
        anonymous: f.anonymous,
        authorName: f.anonymous ? 'Anonymous' : (f.author?.name || 'Anonymous'),
        createdAt: f.createdAt
      })));
    }

    // ── DOCUMENTS ──
    if (path === 'documents.getDocuments') {
      if (!userId) return [];
      const targetId = (args as any)?.userId || userId;
      if (targetId !== userId && !isAdmin && !isCEO) return [];
      return await prisma.document.findMany({
        where: { ownerId: targetId },
        orderBy: { createdAt: 'desc' }
      });
    }

    // ── COMPLIANCE ──
    if (path === 'compliance.getMyCertifications') {
      if (!userId) return [];
      return await prisma.certification.findMany({
        where: { userId },
        orderBy: { expiryDate: 'asc' }
      });
    }
    if (path === 'compliance.getExpiringCertifications') {
      if (!isAdmin && !isCEO) return [];
      const now = new Date();
      const soon = new Date(); soon.setDate(now.getDate() + 30);
      return await prisma.certification.findMany({
        where: mergeWhere({ expiryDate: { gte: now, lte: soon } }, withTenantUserScope(caller)),
        include: { user: { select: { name: true, department: true } } },
        orderBy: { expiryDate: 'asc' }
      });
    }
    if (path === 'compliance.getWhistleblowerReports') {
      if (!isAdmin && !isCEO) return [];
      return await prisma.whistleblowerReport.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    // ── RECRUITMENT ──
    if (path === 'recruitment.getJobs') {
      if (!isAdmin && !isCEO) return [];
      const jobs = await prisma.jobRequisition.findMany({
        include: { candidates: true },
        orderBy: { createdAt: 'desc' }
      });
      return jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        location: j.location,
        type: j.type,
        status: j.status,
        requiredSkills: j.requiredSkills,
        description: j.description,
        candidates: j.candidates.map((c: any) => ({
          id: c.id, name: c.name, email: c.email, status: c.status
        }))
      }));
    }

    // ── DEI (computed bias audit) ──
    if (path === 'dei.getBiasAudit') {
      if (!isAdmin && !isCEO) return { analysis: [], overallAvgSalary: 0 };
      // Group users by department and compare average baseSalary.
      const users = await prisma.user.findMany({
        where: mergeWhere({ baseSalary: { not: null }, department: { not: null } }, tenantWhere),
        select: { department: true, baseSalary: true }
      });
      const groups: Record<string, number[]> = {};
      for (const u of users) {
        const dept = u.department as string;
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(u.baseSalary as number);
      }
      const allSalaries = users.map((u: any) => u.baseSalary as number);
      const globalAvg = allSalaries.length
        ? allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length
        : 0;
      const analysis = Object.entries(groups).map(([dept, salaries]) => {
        const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
        const deviation = globalAvg ? (avg / globalAvg - 1) * 100 : 0;
        return {
          group: dept,
          headcount: salaries.length,
          avgSalary: Math.round(avg),
          deviation: Number(deviation.toFixed(1)),
          biasFlag: Math.abs(deviation) > 20
        };
      });
      return { analysis, overallAvgSalary: Math.round(globalAvg) };
    }

    // ── PROFILE (skills/documents) ──
    if (path === 'profile.getSkills') {
      if (!userId) return [];
      const targetId = (args as any)?.userId || userId;
      if (targetId !== userId && !isAdmin && !isCEO) return [];
      return await prisma.skill.findMany({ where: { userId: targetId } });
    }
    if (path === 'profile.getDocuments') {
      if (!userId) return [];
      return await prisma.document.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' } });
    }

    // ── ATTENDANCE ──
    if (path === 'attendance.getActiveSession') {
      if (!userId) return null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return await prisma.attendance.findFirst({
        where: { userId, date: { gte: today }, clockOut: null },
        orderBy: { clockIn: 'desc' }
      });
    }

    // ── LEAVE (alias) ──
    if (path === 'leave.requestLeave') {
      // Delegated to leave.submitRequest handling below via mutation; return pending list here.
      if (!userId) return [];
      return await prisma.leaveRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    // ── HELPDESK ──
    if (path === 'helpdesk.getTickets') {
      if (isAdmin) return await prisma.ticket.findMany({ where: withTenantUserScope(caller), include: { user: true, replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
      if (!userId) return [];
      return await prisma.ticket.findMany({ where: { userId }, include: { user: true, replies: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
    }

    // ── TEAM (proxy status) ──
    if (path === 'team.getProxyStatus') {
      if (!userId) return null;
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { proxyId: true, proxy: { select: { id: true, name: true } } }
      });
      return u;
    }

    if (path === 'payroll.getRunPreview') {
      if (!isAdmin && !isCEO) return { employeeCount: 0, estimatedNetTotal: 0, totalHours: 0, month: args?.month, year: args?.year };
      const year = args?.year || new Date().getFullYear();
      const rawMonth = args?.month || new Date().toLocaleString('en', { month: 'short' });
      const monthIndex = new Date(`${rawMonth} 1, ${year}`).getMonth();
      const month = new Date(2000, monthIndex, 1).toLocaleString('en', { month: 'short' });
      const periodStart = new Date(year, monthIndex, 1);
      const periodEnd = new Date(year, monthIndex + 1, 1);
      const WORKING_DAYS = 30;

      const users = await prisma.user.findMany({
        where: mergeWhere({ status: 'active' }, tenantWhere),
        select: { id: true, baseSalary: true, createdAt: true },
      });

      let estNetTotal = 0;
      let totalHours = 0;
      for (const u of users) {
        const base = u.baseSalary ?? 0;
        const hourlyRate = base / (WORKING_DAYS * 8);
        const attendances = await prisma.attendance.findMany({
          where: { userId: u.id, date: { gte: periodStart, lt: periodEnd }, clockOut: { not: null } },
        });
        const overtimeMinutes = attendances.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0);
        const nightMinutes = attendances.reduce((sum, a) => sum + (a.nightMinutes || 0), 0);
        const otEarning = (overtimeMinutes / 60) * hourlyRate * 1.5;
        const nightEarning = (nightMinutes / 60) * hourlyRate * 1.25;
        const workedHours = attendances.reduce((sum, a) => sum + Math.max(0, (a.workedMinutes || 0) / 60), 0);
        totalHours += workedHours;
        const pf = estimateProvidentFund(base).monthlyEmployee;
        const { net } = calculatePayroll(base, []);
        estNetTotal += Math.max(0, net - pf + otEarning + nightEarning);
      }
      return {
        month,
        year,
        employeeCount: users.length,
        estimatedNetTotal: Math.round(estNetTotal * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
      };
    }

    // ── System settings (Pillar 4) ──
    if (path === 'settings.getSystemSettings') {
      const rows = await prisma.systemSetting.findMany();
      const map: Record<string, string> = {};
      for (const r of rows) map[r.key] = r.value;
      return map;
    }

    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logError(`Error executing ${path}:`, error);
    throw new Error(message);
  }
}

async function runMutation(path: string, input: any) {
  try {
    // Edge type-safety: validate the action envelope before dispatch.
    const parsed = parseServerAction(path, input);
    path = parsed.path;
    input = parsed.args;

    const caller = await getCaller();
    const isAdmin = caller?.isAdmin ?? false;
    const isCEO = caller?.isCEO ?? false;
    const userId = caller?.id;
    const tenantWhere = callerTenantWhere(caller);

    // ── PROFILE (Self) ──
    if (path === 'profile.updateMyProfile') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');

      // Self-service profile update. Only allow genuinely self-editable,
      // non-privileged fields. Role / status / manager / designation / department
      // are intentionally excluded (privilege-escalation guards); those are
      // handled by the dedicated server actions in src/app/actions/profile.ts
      // (department is self-editable there, designation/employment only by HR/admin).
      const data: any = input?.data || {};
      const updateData: any = {};
      if (typeof data.name === 'string') updateData.name = data.name;
      if (typeof data.avatarUrl === 'string') updateData.avatarUrl = data.avatarUrl;

      if (Object.keys(updateData).length === 0) return { ok: true };

      return await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // ── REGISTRY ──
    if (path === 'registry.createEmployee') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      const { isOwner, role, status, ...safeData } = input || {};
      const tenantId = caller?.tenantId || undefined;
      return await prisma.user.create({ data: { ...safeData, tenantId } as any });
    }
    if (path === 'registry.updateEmployee') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      // Non-admins may only edit a narrow allow-list of safe fields.
      const allowed = ['name', 'designation', 'department', 'avatarUrl', 'employmentType', 'phone', 'location'];
      const data: Record<string, unknown> = {};
      for (const key of allowed) {
        if (input?.data?.[key] !== undefined) data[key] = input.data[key];
      }
      return await prisma.user.update({ where: { id: input.id }, data });
    }
    if (path === 'registry.deleteEmployee') {
      const targetUser = await prisma.user.findUnique({ where: { id: input.id } });
      const freshCaller = caller ? await prisma.user.findUnique({ where: { id: caller.id } }) : null;
      if (!targetUser) throw new Error('User not found');
      if (!freshCaller || !canModifyUser({ role: freshCaller.role, designation: freshCaller.designation ?? undefined, isOwner: freshCaller.isOwner }, { role: targetUser.role, designation: targetUser.designation ?? undefined, isOwner: targetUser.isOwner })) {
        throw new Error('Unauthorized: You do not have permission to remove this user.');
      }
      
      // Delete related records (cascade doesn't always handle supabase auth).
      // Wrap in a transaction so a failure at any step rolls back the whole
      // operation — no orphaned attendance/leave/payroll rows left behind.
      return await prisma.$transaction([
        prisma.attendance.deleteMany({ where: { userId: input.id } }),
        prisma.leaveRequest.deleteMany({ where: { userId: input.id } }),
        prisma.payroll.deleteMany({ where: { userId: input.id } }),
        prisma.expense.deleteMany({ where: { userId: input.id } }),
        prisma.ticket.deleteMany({ where: { userId: input.id } }),
        prisma.notification.deleteMany({ where: { userId: input.id } }),
        prisma.user.updateMany({
          where: { managerId: input.id },
          data: { managerId: null },
        }),
        prisma.user.delete({ where: { id: input.id } }),
      ]);
    }
    if (path === 'registry.updatePermissions') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      const data: Record<string, unknown> = {};
      // Persist the granted permission set (stored as a JSON string on User).
      if (Array.isArray(input.permissions)) {
        data.permissions = JSON.stringify(input.permissions);
      }
      // Account status is still settable here for backwards compatibility.
      if (input.status === 'terminated' || input.status === 'active') {
        data.status = input.status;
      }
      if (Object.keys(data).length === 0) {
        throw new Error('No valid fields provided (expected permissions array and/or status)');
      }
      const updated = await prisma.user.update({ where: { id: input.userId }, data });
      // Keep the cached employee list (used by the registry/hierarchy/grid) fresh.
      try { revalidateTag('employees'); } catch { /* revalidateTag unavailable outside a request scope */ }
      return updated;
    }

    // ── ATTENDANCE ──
    if (path === 'attendance.clockIn') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const now = new Date();
      // Resolve the user's shift for today (if any) to compute lateness/geo.
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const assignment = await prisma.shiftAssignment.findFirst({
        where: { userId, date: { gte: today } },
        include: { shift: true },
        orderBy: { date: 'asc' },
      });
      const shift = assignment?.shift;
      let lateMinutes = 0;
      let geoVerified = true;
      let geoLat: number | null = null;
      let geoLng: number | null = null;
      if (shift) {
        geoLat = typeof input?.geoLat === 'number' ? input.geoLat : null;
        geoLng = typeof input?.geoLng === 'number' ? input.geoLng : null;
        const result = computeAttendance({
          clockIn: now,
          shift: {
            startTime: shift.startTime,
            endTime: shift.endTime,
            graceMinutes: shift.graceMinutes,
            breakMinutes: shift.breakMinutes,
            isNightShift: shift.isNightShift,
          },
          geoLat,
          geoLng,
          geoFence: undefined, // configure per-branch geo-fence where available
        });
        lateMinutes = result.lateMinutes;
        geoVerified = result.geoVerified;
      }
      const record = await prisma.attendance.create({
        data: {
          userId,
          date: now,
          status: lateMinutes > 0 ? 'Late' : 'Present',
          clockIn: now,
          location: input?.location || null,
          branchId: shift?.branchId ?? undefined,
          shiftId: shift?.id ?? undefined,
          lateMinutes,
          geoLat,
          geoLng,
          geoVerified,
        }
      });
      return record;
    }
    if (path === 'attendance.clockOut') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const record = await prisma.attendance.findFirst({
        where: { userId, date: { gte: now }, clockOut: null },
        orderBy: { clockIn: 'desc' }
      });
      if (!record) throw new Error('No active clock-in found');
      const shift = record.shiftId
        ? await prisma.shift.findUnique({ where: { id: record.shiftId } })
        : null;
      const data: Record<string, unknown> = { clockOut: new Date() };
      if (shift && record.clockIn) {
        const result = computeAttendance({
          clockIn: record.clockIn,
          clockOut: new Date(),
          shift: {
            startTime: shift.startTime,
            endTime: shift.endTime,
            graceMinutes: shift.graceMinutes,
            breakMinutes: shift.breakMinutes,
            isNightShift: shift.isNightShift,
          },
        });
        data.workedMinutes = result.workedMinutes;
        data.overtimeMinutes = result.overtimeMinutes;
        data.nightMinutes = result.nightMinutes;
        data.lateMinutes = result.lateMinutes;
      }
      return await prisma.attendance.update({ where: { id: record.id }, data });
    }

    // ── LEAVE ──
    if (path === 'leave.submitRequest') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const request = await prisma.leaveRequest.create({
        data: {
          type: input.type || input.reason,
          details: input.reason,
          status: 'Pending',
          startDate: start,
          endDate: end,
          days,
          userId,
        }
      });
      // Fire automations (e.g. notify_manager) best-effort.
      try {
        const employee = await prisma.user.findUnique({ where: { id: userId! }, select: { managerId: true } });
        await runAutomationRules('leave.requested', {
          userId,
          name: caller?.name,
          detail: `requested ${input.type} leave (${days} days)`,
          managerId: employee?.managerId,
          leaveRequestId: request.id,
        }, caller);
      } catch (autoErr) {
        logError('Leave automation failed (non-fatal):', autoErr);
      }
      // Notify all admins
      const admins = await prisma.user.findMany({ where: mergeWhere({ role: { in: ['Admin', 'HR Manager'] } }, tenantWhere) });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            message: `${caller!.name} requested ${input.type} leave (${days} days)`,
            type: 'leave',
            link: '/leave',
          }
        });
        
        if (admin.pushSub) {
          try {
            await webpush.sendNotification(
              admin.pushSub as unknown as webpush.PushSubscription,
              JSON.stringify({
                title: 'Leave Request',
                body: `${caller!.name} requested ${input.type} leave (${days} days)`,
                url: '/applications'
              })
            );
          } catch (pushErr) {
            logError('Push notification failed for admin', pushErr, { adminId: admin.id });
          }
        }
      }
      return request;
    }
    if (path === 'leave.updateStatus') {
      if (!isAdmin) throw new Error('Forbidden');
      const updated = await prisma.leaveRequest.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { user: true }
      });
      // Notify the employee
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          message: `Your ${updated.type} leave request has been ${input.status}`,
          type: 'leave',
          link: '/leave',
        }
      });
      return updated;
    }

    // ── PAYROLL ──
    if (path === 'payroll.createHead') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      return await prisma.salaryHead.create({ data: input });
    }

    // ── EXPENSES ──
    if (path === 'expenses.createExpense') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.expense.create({ data: { ...input, userId } });
    }

    if (path === 'expenses.updateStatus') {
      if (!isAdmin && !isCEO) throw new Error('Forbidden');
      if (!input?.id) throw new Error('Expense id is required');
      const updated = await prisma.expense.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { user: true },
      });
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          message: `Your expense of ৳${updated.amount} has been ${input.status}`,
          type: 'expense',
          link: '/expenses',
        },
      });
      return updated;
    }

    // ── PENALTIES (admin/HR only; employees view their own) ──
    if (path === 'expenses.createPenalty') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId || !input?.amount || !input?.reason) throw new Error('Missing penalty details');
      return await prisma.penalty.create({
        data: {
          userId: input.userId,
          amount: Number(input.amount),
          reason: input.reason,
          status: input.status || 'UNPAID',
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });
    }
    if (path === 'expenses.updatePenaltyStatus') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Penalty id required');
      return await prisma.penalty.update({ where: { id: input.id }, data: { status: input.status } });
    }

    if (path === 'departments.createDepartment') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.name) throw new Error('Department name is required');
      return await prisma.department.create({
        data: {
          name: input.name,
          budget: input.budget ?? null,
          headId: input.headId || null,
          branchId: input.branchId || null,
        },
      });
    }

    // ── REVIEWS: submission flow (creates Review + per-dimension ReviewScore rows) ──
    if (path === 'reviews.submit') {
      if (!isAdmin && !isCEO && !userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.userId) throw new Error('Review subject (userId) is required');
      if (!Array.isArray(input.scores) || input.scores.length === 0) {
        throw new Error('At least one competency score is required');
      }
      const review = await prisma.review.create({
        data: {
          userId: input.userId,
          reviewerId: userId!,
          reviewPeriod: input.reviewPeriod || new Date().getFullYear().toString(),
          rating: input.rating || 'Meets Expectations',
          comments: input.comments || '',
          scores: {
            create: input.scores.map((s: any) => ({
              dimension: s.dimension,
              rating: Number(s.rating),
              reviewerId: userId!,
              userId: input.userId,
            })),
          },
        },
      });
      await prisma.notification.create({
        data: {
          userId: input.userId,
          message: `You received a new performance review for ${review.reviewPeriod}.`,
          type: 'review',
          link: '/reviews',
        },
      });
      return review;
    }

    // ── NOTIFICATIONS ──
    if (path === 'notifications.markRead') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const notification = await prisma.notification.findUnique({ where: { id: input.id } });
      if (!notification || notification.userId !== userId) {
        throw new MutationError('NOT_FOUND', 'Notification not found');
      }
      return await prisma.notification.update({ where: { id: input.id }, data: { read: true } });
    }
    if (path === 'notifications.markAllRead') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    }
    if (path === 'notifications.savePushSub') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.user.update({
        where: { id: userId },
        data: { pushSub: null as any },
      });
    }
    if (path === 'notifications.removePushSub') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.user.update({
        where: { id: userId },
        data: { pushSub: null as any }
      });
    }

    // ── APPLICATIONS ──
    if (path === 'applications.submit') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const start = new Date();
      const end = new Date();
      return await prisma.leaveRequest.create({
        data: {
          type: input.type,
          details: input.details,
          status: 'Pending',
          startDate: start,
          endDate: end,
          days: 1,
          userId,
        }
      });
    }

    if (path === 'applications.updateStatus') {
      if (!isAdmin) throw new Error('Forbidden');
      return await prisma.leaveRequest.update({
        where: { id: input.id },
        data: { status: input.status }
      });
    }

    // ── COMPANY NEWS CRUD ──
    if (path === 'news.create' || path === 'announcements.create') {
      if (!userId || !canCreateNews(caller)) throw new Error('Unauthorized: You do not have permission to post news.');
      
      const news = await prisma.companyNews.create({
        data: {
          title: input.title,
          content: input.content,
          priority: input.priority || 'Medium',
          category: input.category || 'Universal',
          targetTeam: input.targetTeam || null,
          authorId: userId,
          authorName: caller!.name,
          isPinned: input.isPinned || false,
        }
      });

      // Send notifications
      let targetUsers;
      if (input.category === 'Team' && input.targetTeam) {
        targetUsers = await prisma.user.findMany({ where: mergeWhere({ department: input.targetTeam, NOT: { id: userId } }, tenantWhere) });
      } else {
        targetUsers = await prisma.user.findMany({ where: mergeWhere({ NOT: { id: userId } }, tenantWhere) });
      }

      const priorityLabel = input.priority === 'Emergency' ? '🚨 EMERGENCY' : input.priority === 'High' ? '⚠️ HIGH PRIORITY' : '';
      for (const targetUser of targetUsers) {
        await prisma.notification.create({
          data: {
            userId: targetUser.id,
            message: `${priorityLabel} New ${input.category || 'company'} news: ${input.title}`.trim(),
            type: 'news',
            link: '/announcements',
          }
        });
      }

      return news;
    }

    if (path === 'news.update' || path === 'announcements.update') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const existing = await prisma.companyNews.findUnique({ where: { id: input.id } });
      if (!existing) throw new Error('News not found');
      if (!canManageNews(caller, existing.authorId)) throw new Error('Unauthorized: You do not have permission to edit this news.');

      return await prisma.companyNews.update({
        where: { id: input.id },
        data: {
          title: input.title !== undefined ? input.title : undefined,
          content: input.content !== undefined ? input.content : undefined,
          priority: input.priority !== undefined ? input.priority : undefined,
          category: input.category !== undefined ? input.category : undefined,
          targetTeam: input.targetTeam !== undefined ? input.targetTeam : undefined,
          isPinned: input.isPinned !== undefined ? input.isPinned : undefined,
          isEdited: true,
        }
      });
    }

    if (path === 'news.delete' || path === 'announcements.delete') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const existing = await prisma.companyNews.findUnique({ where: { id: input.id } });
      if (!existing) throw new Error('News not found');
      if (!canManageNews(caller, existing.authorId)) throw new Error('Unauthorized: You do not have permission to delete this news.');

      return await prisma.companyNews.delete({ where: { id: input.id } });
    }

    if (path === 'announcements.markRead') {
      // Legacy compat — mark as read via notification
      return { success: true };
    }

    // ── TEAM TASKS CRUD ──
    if (path === 'team.createTask') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      
      const task = await prisma.teamTask.create({
        data: {
          title: input.title,
          description: input.description || null,
          priority: input.priority || 'Medium',
          assigneeId: input.assigneeId,
          assignerId: userId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }
      });

      // Notify assignee
      if (input.assigneeId !== userId) {
        await prisma.notification.create({
          data: {
            userId: input.assigneeId,
            message: `${caller!.name} assigned you a new task: ${input.title}`,
            type: 'info',
            link: '/team',
          }
        });
      }

      return task;
    }

    if (path === 'team.updateTaskStatus') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const task = await prisma.teamTask.findUnique({ where: { id: input.id } });
      if (!task) throw new Error('Task not found');
      
      // Only assignee or assigner can update
      if (task.assigneeId !== userId && task.assignerId !== userId && !isAdmin && !isCEO) {
        throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      }

      const updateData: any = { status: input.status };
      if (input.status === 'Done') {
        updateData.completedAt = new Date();
      }

      const updated = await prisma.teamTask.update({
        where: { id: input.id },
        data: updateData
      });

      // Notify the other party
      const notifyUserId = task.assigneeId === userId ? task.assignerId : task.assigneeId;
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          message: `Task "${task.title}" status updated to ${input.status}`,
          type: 'info',
          link: '/team',
        }
      });

      return updated;
    }

    if (path === 'team.deleteTask') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const task = await prisma.teamTask.findUnique({ where: { id: input.id } });
      if (!task) throw new Error('Task not found');
      if (task.assignerId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.teamTask.delete({ where: { id: input.id } });
    }

    // ── CALENDAR EVENTS CRUD ──
    if (path === 'calendar.createEvent') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');

      const event = await prisma.calendarEvent.create({
        data: {
          title: input.title,
          description: input.description || null,
          date: new Date(input.date),
          endDate: input.endDate ? new Date(input.endDate) : null,
          type: input.type || 'General',
          creatorId: userId,
          assigneeId: input.assigneeId || null,
          targetTeam: input.targetTeam || null,
          status: input.status || 'Pending',
          reminderMinutes: input.reminderMinutes || 30,
        }
      });

      // Notify assignee if assigned
      if (input.assigneeId && input.assigneeId !== userId) {
        await prisma.notification.create({
          data: {
            userId: input.assigneeId,
            message: `${caller!.name} assigned you: ${input.title} on ${new Date(input.date).toLocaleDateString()}`,
            type: 'calendar',
            link: '/calendar',
          }
        });
      }

      // Notify team if team event
      if (input.targetTeam) {
        const teamMembers = await prisma.user.findMany({ where: mergeWhere({ department: input.targetTeam, NOT: { id: userId } }, tenantWhere) });
        for (const member of teamMembers) {
          await prisma.notification.create({
            data: {
              userId: member.id,
              message: `New team event: ${input.title} on ${new Date(input.date).toLocaleDateString()}`,
              type: 'calendar',
              link: '/calendar',
            }
          });
        }
      }

      return event;
    }

    if (path === 'calendar.updateEvent') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const event = await prisma.calendarEvent.findUnique({ where: { id: input.id } });
      if (!event) throw new Error('Event not found');
      if (event.creatorId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');

      return await prisma.calendarEvent.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          date: input.date ? new Date(input.date) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          type: input.type,
          status: input.status,
          assigneeId: input.assigneeId,
          targetTeam: input.targetTeam,
          reminderMinutes: input.reminderMinutes,
        }
      });
    }

    if (path === 'calendar.deleteEvent') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const event = await prisma.calendarEvent.findUnique({ where: { id: input.id } });
      if (!event) throw new Error('Event not found');
      if (event.creatorId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.calendarEvent.delete({ where: { id: input.id } });
    }

    // ── SHIFTS (mutations) ──
    if (path === 'shifts.assignShift') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId || !input?.shiftId || !input?.date) throw new Error('Missing required fields');
      return await prisma.shiftAssignment.upsert({
        where: { shiftId_userId_date: { shiftId: input.shiftId, userId: input.userId, date: new Date(input.date) } },
        create: {
          userId: input.userId,
          shiftId: input.shiftId,
          date: new Date(input.date),
          teamId: input.teamId || null,
          workNote: input.workNote || null,
          roleOnShift: input.roleOnShift || null,
        },
        update: {
          teamId: input.teamId || null,
          workNote: input.workNote || null,
          roleOnShift: input.roleOnShift || null,
        },
      });
    }
    if (path === 'shifts.removeAssignment') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Missing assignment id');
      return await prisma.shiftAssignment.delete({ where: { id: input.id } });
    }
    if (path === 'shifts.autoGenerateRoster') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      const dateStr = input?.startDate || new Date().toISOString();
      const date = new Date(dateStr);
      const shifts = await prisma.shift.findMany({
        where: { branch: { tenantId: caller?.tenantId ?? '' } },
      });
      if (shifts.length === 0) throw new Error('No shifts configured');
      const employees = await prisma.user.findMany({ where: mergeWhere({ status: 'active', role: { not: 'CEO' } }, tenantWhere) });
      if (employees.length === 0) return { success: true, assigned: 0 };
      // Simple round-robin heuristic across the active shifts.
      let i = 0;
      const created = [];
      for (const emp of employees) {
        const shift = shifts[i % shifts.length];
        created.push({ userId: emp.id, shiftId: shift.id });
        i++;
      }
      await prisma.shiftAssignment.createMany({ data: created.map((c) => ({ ...c, date })) });
      return { success: true, assigned: created.length };
    }
    if (path === 'shifts.createShift') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.name || !input?.startTime || !input?.endTime) throw new Error('Missing required fields');
      return await prisma.shift.create({
        data: {
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location || null,
          graceMinutes: input.graceMinutes ?? 10,
          isNightShift: Boolean(input.isNightShift),
          breakMinutes: input.breakMinutes ?? 60,
          recurringDays: input.recurringDays || [],
          branchId: input.branchId || null,
        },
      });
    }
    if (path === 'shifts.updateShift') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Missing shift id');
      return await prisma.shift.update({
        where: { id: input.id },
        data: {
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location ?? undefined,
          graceMinutes: input.graceMinutes,
          isNightShift: input.isNightShift === undefined ? undefined : Boolean(input.isNightShift),
          breakMinutes: input.breakMinutes,
          recurringDays: input.recurringDays,
          branchId: input.branchId === undefined ? undefined : (input.branchId || null),
        },
      });
    }
    if (path === 'shifts.deleteShift') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Missing shift id');
      return await prisma.shift.delete({ where: { id: input.id } });
    }
    if (path === 'shifts.createTeam') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.name) throw new Error('Team name required');
      return await prisma.team.create({
        data: {
          name: input.name,
          description: input.description || null,
          branchId: input.branchId || null,
          leadId: input.leadId || null,
          memberIds: input.memberIds || [],
        },
      });
    }
    if (path === 'shifts.updateTeam') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Missing team id');
      return await prisma.team.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description ?? undefined,
          branchId: input.branchId === undefined ? undefined : (input.branchId || null),
          leadId: input.leadId === undefined ? undefined : (input.leadId || null),
          memberIds: input.memberIds,
        },
      });
    }
    if (path === 'shifts.deleteTeam') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Missing team id');
      return await prisma.team.delete({ where: { id: input.id } });
    }

    // ── PERFORMANCE (mutations) ──
    if (path === 'performance.createObjective') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const targetId = input?.userId || userId;
      if (targetId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.title || !input.title.trim()) throw new Error('Title required');
      return await prisma.objective.create({
        data: { title: input.title.trim(), userId: targetId, progress: 0, status: 'On Track' }
      });
    }
    if (path === 'performance.updateObjectiveProgress') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const obj = await prisma.objective.findUnique({ where: { id: input.id } });
      if (!obj) throw new Error('Objective not found');
      if (obj.userId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const progress = Math.max(0, Math.min(100, Number(input.progress) || 0));
      const status = progress >= 100 ? 'Completed' : (progress >= 70 ? 'On Track' : 'At Risk');
      return await prisma.objective.update({ where: { id: input.id }, data: { progress, status } });
    }

    // ── RECRUITMENT (mutations) ──
    if (path === 'recruitment.createJob') {
      if (!isAdmin && !isCEO) throw new Error('Unauthorized: HR only');
      if (!input?.title || !input.title.trim()) throw new Error('Job title required');
      return await prisma.jobRequisition.create({
        data: {
          title: input.title.trim(),
          department: input.department || 'General',
          location: input.location || 'Remote',
          type: input.type || 'Full-Time',
          description: input.description || null,
          requiredSkills: input.requiredSkills || null,
          ownerId: userId!
        }
      });
    }
    if (path === 'recruitment.updateCandidateStatus') {
      if (!isAdmin && !isCEO) throw new Error('Unauthorized: HR only');
      if (!input?.candidateId || !input?.status) throw new Error('Missing fields');
      return await prisma.candidate.update({
        where: { id: input.candidateId },
        data: { status: input.status }
      });
    }
    if (path === 'recruitment.updateCandidate') {
      if (!isAdmin && !isCEO) throw new Error('Unauthorized: HR only');
      if (!input?.candidateId) throw new Error('Missing candidate id');
      return await prisma.candidate.update({
        where: { id: input.candidateId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          resumeUrl: input.resumeUrl ?? undefined,
        },
      });
    }
    if (path === 'training.enroll') {
      if (!isAdmin && !isCEO && !userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.courseId) throw new Error('Missing course id');
      const targetUser = input.userId || userId!;
      return await prisma.trainingEnrollment.upsert({
        where: { userId_courseId: { userId: targetUser, courseId: input.courseId } },
        update: { status: 'Enrolled', progress: 0, completedAt: null },
        create: { userId: targetUser, courseId: input.courseId, status: 'Enrolled' },
      });
    }
    if (path === 'training.updateProgress') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id) throw new Error('Missing enrollment id');
      const progress = Math.max(0, Math.min(100, Number(input.progress) || 0));
      const status = progress >= 100 ? 'Completed' : 'InProgress';
      return await prisma.trainingEnrollment.update({
        where: { id: input.id },
        data: { progress, status, completedAt: status === 'Completed' ? new Date() : null },
      });
    }
    if (path === 'recruitment.findInternalMatches') {
      if (!isAdmin && !isCEO) throw new Error('Unauthorized: HR only');
      // Very light "AI": match employees whose skills intersect the job's required skills.
      const job = await prisma.jobRequisition.findUnique({ where: { id: input.jobId } });
      if (!job) throw new Error('Job not found');
      let requiredSkills: string[] = [];
      try { requiredSkills = job.requiredSkills ? JSON.parse(job.requiredSkills) : []; } catch { requiredSkills = []; }
      const reqLower = requiredSkills.map((s: string) => s.toLowerCase());
      const candidates = await prisma.user.findMany({
        where: mergeWhere({ status: 'active', id: { not: userId } }, tenantWhere),
        include: { skills: true }
      });
      const matches = candidates
        .map((u) => {
          const userSkills = u.skills.map((s) => s.skill.toLowerCase());
          const matched = reqLower.filter((r) => userSkills.some((us: string) => us.includes(r)));
          return { id: u.id, name: u.name, department: u.department, matchedSkills: matched };
        })
        .filter((m) => m.matchedSkills.length > 0)
        .sort((a, b) => b.matchedSkills.length - a.matchedSkills.length)
        .slice(0, 10);
      return matches;
    }

    // ── COMPLIANCE (mutations) ──
    if (path === 'compliance.addCertification') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.name || !input?.expiryDate) throw new Error('Name and expiry date required');
      return await prisma.certification.create({
        data: { name: input.name, expiryDate: new Date(input.expiryDate), userId: userId! }
      });
    }
    if (path === 'compliance.submitWhistleblower') {
      if (!input?.report || !input.report.trim()) throw new Error('Report required');
      return await prisma.whistleblowerReport.create({
        data: { report: input.report.trim(), userId: userId || null, status: 'Received' }
      });
    }

    // ── BENEFITS / EQUITY (mutations) ──
    if (path === 'benefits.enrollBenefit') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.benefitId) throw new Error('Benefit required');
      return await prisma.benefitEnrollment.create({
        data: { userId: userId!, benefitId: input.benefitId, status: 'ENROLLED' }
      });
    }

    // ── RECOGNITION (mutations) ──
    if (path === 'recognition.sendKudo') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.receiverId || !input?.message) throw new Error('Receiver and message required');
      return await prisma.kudo.create({
        data: { senderId: userId!, receiverId: input.receiverId, message: input.message, category: input.category || 'Appreciation' }
      });
    }

    // ── PERFORMANCE CALIBRATION (P8) ──
    if (path === 'performance.createCalibrationSession') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.label || !input?.reviewPeriod) throw new Error('Label and review period required');
      return await prisma.calibrationSession.create({
        data: { label: input.label, reviewPeriod: input.reviewPeriod, status: 'Draft', createdById: userId! }
      });
    }
    if (path === 'performance.addCalibrationEntry') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.sessionId || !input?.reviewId || !input?.userId) throw new Error('Missing fields');
      const multiplier = typeof input.multiplier === 'number' ? input.multiplier : 1;
      const calibratedScore = Math.round((Number(input.rawScore) || 0) * multiplier * 100) / 100;
      return await prisma.calibrationEntry.upsert({
        where: { sessionId_reviewId: { sessionId: input.sessionId, reviewId: input.reviewId } },
        update: { rawScore: Number(input.rawScore) || 0, multiplier, calibratedScore, note: input.note || null },
        create: {
          sessionId: input.sessionId, reviewId: input.reviewId, userId: input.userId,
          rawScore: Number(input.rawScore) || 0, multiplier, calibratedScore, note: input.note || null,
        },
      });
    }
    if (path === 'performance.lockCalibrationSession') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id || !input?.status) throw new Error('Missing fields');
      return await prisma.calibrationSession.update({ where: { id: input.id }, data: { status: input.status } });
    }

    // ── TRAINING / LMS (P8) ──
    if (path === 'training.updateProgress') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.enrollmentId || typeof input.progress !== 'number') throw new Error('Missing fields');
      const progress = Math.max(0, Math.min(100, Math.round(input.progress)));
      const status = progress >= 100 ? 'Completed' : 'InProgress';
      return await prisma.trainingEnrollment.update({
        where: { id: input.enrollmentId },
        data: { progress, status, completedAt: status === 'Completed' ? new Date() : null },
      });
    }
    if (path === 'training.unenroll') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.enrollmentId) throw new Error('Missing fields');
      return await prisma.trainingEnrollment.delete({ where: { id: input.enrollmentId } });
    }

    // ── WHISTLEBLOWER COMMITTEE WORKFLOW (P9) ──
    if (path === 'whistleblower.updateStatus') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id || !input?.status) throw new Error('Missing fields');
      return await prisma.whistleblowerReport.update({
        where: { id: input.id },
        data: { status: input.status, resolution: input.resolution !== undefined ? input.resolution : undefined },
      });
    }
    if (path === 'whistleblower.assign') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id) throw new Error('Missing fields');
      return await prisma.whistleblowerReport.update({ where: { id: input.id }, data: { assignedTo: input.assignedTo || null } });
    }
    if (path === 'committee.addMember') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.name || !input?.role) throw new Error('Name and role required');
      return await prisma.committeeMember.create({ data: { name: input.name, role: input.role, isChair: !!input.isChair, email: input.email || null } });
    }
    if (path === 'committee.removeMember') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id) throw new Error('Missing fields');
      return await prisma.committeeMember.delete({ where: { id: input.id } });
    }
    if (path === 'committee.setChair') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id) throw new Error('Missing fields');
      await prisma.committeeMember.updateMany({ where: { isChair: true }, data: { isChair: false } });
      return await prisma.committeeMember.update({ where: { id: input.id }, data: { isChair: true } });
    }

    // ── ENGAGEMENT GREETING RULES (P10) ──
    if (path === 'engagement.setRuleActive') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id || typeof input.isActive !== 'boolean') throw new Error('Missing fields');
      return await prisma.greetingRule.update({ where: { id: input.id }, data: { isActive: input.isActive } });
    }

    // ── FEEDBACK (mutations) ──
    if (path === 'feedback.submitFeedback') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.content || !input.content.trim()) throw new Error('Feedback required');
      return await prisma.feedback.create({
        data: {
          content: input.content.trim(),
          type: input.type || 'Suggestion',
          anonymous: input.anonymous !== false,
          authorId: userId!,
          recipientId: input.recipientId || null
        }
      });
    }
    if (path === 'feedback.updateFeedbackStatus') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.id || !input?.status) throw new Error('Missing fields');
      return await prisma.feedback.update({ where: { id: input.id }, data: { status: input.status } });
    }

    // ── DOCUMENTS (mutations) ──
    if (path === 'documents.createDocument') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.title || !input?.url) throw new Error('Title and URL required');
      return await prisma.document.create({
        data: {
          title: input.title,
          url: input.url,
          fileName: input.fileName || input.title,
          size: input.size || null,
          mimeType: input.mimeType || null,
          type: input.type || 'General',
          category: input.category || 'General',
          status: input.status || 'ACTIVE',
          // Admin distributes to a target employee; otherwise the uploader owns it.
          ownerId: input.ownerId || userId!
        }
      });
    }
    if (path === 'documents.signDocument') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const doc = await prisma.document.findUnique({ where: { id: input.id } });
      if (!doc) throw new Error('Document not found');
      if (doc.ownerId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.document.update({ where: { id: input.id }, data: { signed: true, signedAt: new Date() } });
    }

    // ── PROFILE (skills/documents) ──
    if (path === 'profile.addSkill') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.skill || !input.skill.trim()) throw new Error('Skill required');
      const level = Math.max(1, Math.min(5, Number(input.level) || 1));
      return await prisma.skill.create({
        data: { userId: userId!, skill: input.skill.trim(), level }
      });
    }
    if (path === 'profile.removeSkill') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      // Remove by skill name for the current user.
      const skillName = input?.skill;
      if (!skillName) throw new Error('Skill required');
      return await prisma.skill.deleteMany({ where: { userId, skill: skillName } });
    }
    if (path === 'profile.uploadDocument') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.title || !input?.url) throw new Error('Title and URL required');
      return await prisma.document.create({
        data: { title: input.title, url: input.url, type: input.type || 'General', ownerId: userId! }
      });
    }

    // ── PAYROLL STRUCTURES ──
    if (path === 'payroll.createStructure') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.name || !input?.baseSalary || !input?.heads) throw new Error('Missing fields');
      return await prisma.salaryStructure.create({
        data: {
          name: input.name,
          baseSalary: Number(input.baseSalary),
          heads: input.heads // JSON map of head name -> amount
        }
      });
    }
    if (path === 'payroll.getStructures') {
      if (!isAdmin && !isCEO) return [];
      return await prisma.salaryStructure.findMany({ orderBy: { createdAt: 'desc' } });
    }
    if (path === 'payroll.grantFestivalBonus') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId || !input?.occasion || !input?.year) throw new Error('Missing fields');
      const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { baseSalary: true, name: true } });
      const base = user?.baseSalary ?? 0;
      const bonus = input.amount != null ? Number(input.amount) : estimateFestivalBonus(base);
      return await prisma.festivalBonus.create({
        data: {
          userId: input.userId,
          year: Number(input.year),
          occasion: input.occasion,
          occasionBn: input.occasionBn || null,
          amount: bonus,
          baseSalarySnapshot: base,
          status: input.status || 'PAID',
        },
      });
    }
    if (path === 'payroll.runAutomatedPayroll') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      const year = input?.year || new Date().getFullYear();
      // Normalize the month to a canonical 3-letter short name (e.g. "Jul") so
      // that numeric inputs from the UI (7) and default string inputs ("Jul")
      // dedupe consistently. `new Date(7 1, 2025)` parses as July.
      const rawMonth = input?.month || new Date().toLocaleString('en', { month: 'short' });
      const monthIndex = new Date(`${rawMonth} 1, ${year}`).getMonth();
      const month = new Date(2000, monthIndex, 1).toLocaleString('en', { month: 'short' });
      const periodStart = new Date(year, monthIndex, 1);
      const periodEnd = new Date(year, monthIndex + 1, 1);

      const structures = await prisma.salaryStructure.findMany();
      const headMeta = await prisma.salaryHead.findMany();
      const headByName = new Map(headMeta.map((h) => [h.name, h]));

      const WORKING_DAYS = 30; // standard BD monthly working days for LWP math

      let created = 0;
      for (const s of structures) {
        const rawHeads = (s.heads as Record<string, number>) || {};
        const baseEntries = Object.entries(rawHeads).map(([name, amount]) => {
          const meta = headByName.get(name);
          return {
            name,
            amount,
            type: (meta?.type as 'EARNING' | 'DEDUCTION') || (amount >= 0 ? 'EARNING' : 'DEDUCTION'),
          };
        });

        const users = await prisma.user.findMany({
          where: { status: 'active' },
          select: { id: true, baseSalary: true, name: true, createdAt: true },
        });

        for (const u of users) {
          const exists = await prisma.payroll.findFirst({ where: { userId: u.id, month, year } });
          if (exists) continue;

          const base = u.baseSalary ?? s.baseSalary;
          const hourlyRate = base / (WORKING_DAYS * 8); // 8h standard day

          // ── Attendance linkage ──
          const attendances = await prisma.attendance.findMany({
            where: { userId: u.id, date: { gte: periodStart, lt: periodEnd } },
          });
          const overtimeMinutes = attendances.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0);
          const nightMinutes = attendances.reduce((sum, a) => sum + (a.nightMinutes || 0), 0);
          const lateDays = attendances.filter((a) => (a.lateMinutes || 0) > 0).length;
          const overtimeHours = Math.round((overtimeMinutes / 60) * 100) / 100;
          const nightHours = Math.round((nightMinutes / 60) * 100) / 100;

          const otEarning = overtimeHours * hourlyRate * 1.5; // 1.5x OT
          const nightEarning = nightHours * hourlyRate * 1.25; // 1.25x night differential

          // ── Leave linkage (LWP = leave without pay) ──
          const approvedLeaves = await prisma.leaveRequest.findMany({
            where: {
              userId: u.id,
              status: 'Approved',
              startDate: { lt: periodEnd },
              endDate: { gte: periodStart },
            },
          });
          // Only unpaid leave types reduce pay. Casual/Sick/Earned/Festival/Maternity/
          // Paternity are paid (statutory), so LWP applies to any custom unpaid type
          // or when a leave type is flagged unpaid. We treat only leaves whose type
          // maps to a clearly unpaid bucket as LWP; paid statutory buckets are excluded.
          const PAID_CATEGORIES = new Set(['Casual', 'Earned', 'Sick', 'Festival', 'Maternity', 'Paternity']);
          let lwpDays = 0;
          for (const lv of approvedLeaves) {
            const category = await resolveLeaveCategory(lv.type);
            if (category && !PAID_CATEGORIES.has(category)) {
              // Overlap with the period window.
              const start = new Date(lv.startDate) < periodStart ? periodStart : new Date(lv.startDate);
              const end = new Date(lv.endDate) >= periodEnd ? new Date(periodEnd.getTime() - 1) : new Date(lv.endDate);
              const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
              lwpDays += days;
            }
          }
          const lwpDeduction = lwpDays * (base / WORKING_DAYS);

          // ── Build final salary-head entries ──
          const entries = [...baseEntries];
          if (otEarning > 0) entries.push({ name: 'Overtime', amount: Math.round(otEarning * 100) / 100, type: 'EARNING' });
          if (nightEarning > 0) entries.push({ name: 'Night Differential', amount: Math.round(nightEarning * 100) / 100, type: 'EARNING' });
          if (lwpDeduction > 0) entries.push({ name: 'Leave Without Pay', amount: -Math.round(lwpDeduction * 100) / 100, type: 'DEDUCTION' });

          const { earnings, deductions, tax, net } = calculatePayroll(base, entries);

          // ── PF: employer 10% + employee 10% match deducted from net ──
          const pf = estimateProvidentFund(base);
          const employeePf = pf.monthlyEmployee;
          const employerPf = pf.monthlyEmployer;
          const pfDeductionEntry = { head: 'Provident Fund (Employee)', amount: employeePf };

          // Re-run payroll math with the employee PF deduction included.
          const finalDeductions = deductions + employeePf;
          const finalNet = Math.round((net - employeePf) * 100) / 100;

          // ── Festival bonus: only if a FestivalBonus record exists for this period ──
          const festivalRecord = await prisma.festivalBonus.findFirst({
            where: { userId: u.id, year, status: 'PAID' },
          });
          const festival = festivalRecord?.amount ?? 0;

          const earningsBreakdown = entries
            .filter((e) => e.amount >= 0)
            .map((e) => ({ head: e.name, amount: e.amount }));
          const deductionsBreakdown = [
            ...entries.filter((e) => e.amount < 0).map((e) => ({ head: e.name, amount: Math.abs(e.amount) })),
            pfDeductionEntry,
          ];

          await prisma.payroll.create({
            data: {
              month,
              year,
              earnings,
              deductions: Math.round(finalDeductions * 100) / 100,
              totalAmount: finalNet + festival,
              netPay: finalNet + festival,
              tax,
              providentFund: employerPf, // employer portion recorded; employee portion already deducted
              gratuityAccrued: Math.round(estimateGratuity(base, yearsOfService(u)) * 100) / 100,
              festivalBonus: festival,
              overtimeHours,
              nightHours,
              lateDays,
              earningsBreakdown,
              deductionsBreakdown,
              salaryStructureId: s.id,
              userId: u.id,
            },
          });
          created++;
        }
      }
      return { success: true, created };
    }

    if (path === 'settings.setSystemSetting') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.key) throw new Error('Setting key is required');
      await prisma.systemSetting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: String(input.value), updatedById: userId },
        update: { value: String(input.value), updatedById: userId },
      });
      return { success: true };
    }

    // ── PAYMENT HUB (payments + sales) ──
    if (path === 'payroll.recordPayment') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      // Employee can record their own payment; admin/HR can record for anyone.
      const targetUserId = isAdmin || isCEO ? (input.userId || userId) : userId;
      if (!input?.amount || !input?.month || !input?.year) throw new Error('Missing payment details');
      return await prisma.payment.create({
        data: {
          userId: targetUserId,
          payrollId: input.payrollId || null,
          month: Number(input.month),
          year: Number(input.year),
          amount: Number(input.amount),
          method: input.method || 'BKASH',
          reference: input.reference || null,
          status: input.status || 'PAID',
          details: input.details || null,
        },
      });
    }
    if (path === 'payroll.markPaymentPaid') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Missing payment id');
      return await prisma.payment.update({ where: { id: input.id }, data: { status: 'PAID' } });
    }
    if (path === 'payroll.recordSale') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId || !input?.amount || !input?.month || !input?.year) throw new Error('Missing sale details');
      return await prisma.sale.create({
        data: {
          userId: input.userId,
          month: Number(input.month),
          year: Number(input.year),
          amount: Number(input.amount),
          note: input.note || null,
        },
      });
    }

    // ── ASSETS (mutations) ──
    if (path === 'assets.createAsset') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.name) throw new Error('Asset name required');
      return await prisma.asset.create({
        data: {
          name: input.name,
          status: input.status || 'Active',
          purchasePrice: Number(input.purchasePrice) || 0,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : new Date(),
          userId: input.userId || null
        }
      });
    }
    if (path === 'assets.updateAsset') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id) throw new Error('Asset id required');
      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.status !== undefined) data.status = input.status;
      if (input.userId !== undefined) data.userId = input.userId || null;
      if (input.purchasePrice !== undefined) data.purchasePrice = Number(input.purchasePrice);
      return await prisma.asset.update({ where: { id: input.id }, data });
    }

    // ── TEAM (delegation proxy) ──
    if (path === 'team.setProxy') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.proxyId) throw new Error('Proxy user required');
      if (input.proxyId === userId) throw new Error('Cannot delegate to yourself');
      const data: any = { proxyId: input.proxyId };
      if (input.proxyValidUntil) data.proxyValidUntil = new Date(input.proxyValidUntil);
      return await prisma.user.update({ where: { id: userId }, data });
    }
    if (path === 'team.clearProxy') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.user.update({ where: { id: userId }, data: { proxyId: null, proxyValidUntil: null } });
    }

    // ── LEAVE (alias mutation) ──
    if (path === 'leave.requestLeave') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return await prisma.leaveRequest.create({
        data: {
          type: input.type || input.reason || 'Annual',
          details: input.reason,
          status: 'Pending',
          startDate: start,
          endDate: end,
          days,
          userId
        }
      });
    }

    // ── HELPDESK (mutations) ──
    if (path === 'helpdesk.createTicket') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.subject) throw new Error('Subject required');
      return await prisma.ticket.create({
        data: { subject: input.subject, priority: input.priority || 'Medium', status: 'Open', userId: userId! }
      });
    }
    if (path === 'helpdesk.addReply') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      if (!input?.ticketId || !input?.content) throw new Error('Missing fields');
      const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
      if (!ticket) throw new Error('Ticket not found');
      if (ticket.userId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.ticketReply.create({
        data: { ticketId: input.ticketId, authorId: userId!, content: input.content }
      });
    }
    if (path === 'helpdesk.updateTicketStatus') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.id || !input?.status) throw new Error('Missing fields');
      return await prisma.ticket.update({ where: { id: input.id }, data: { status: input.status } });
    }

    // ── AUTOMATIONS (mutations) ──
    if (path === 'automations.create') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.name || !input?.trigger || !input?.action) throw new Error('Missing fields');
      return await prisma.automationRule.create({
        data: {
          name: input.name,
          description: input.description || null,
          trigger: input.trigger,
          condition: input.condition || null,
          action: input.action,
          status: input.status || 'Active',
          ownerId: userId!
        }
      });
    }
    if (path === 'automations.toggle') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      const rule = await prisma.automationRule.findUnique({ where: { id: input.id } });
      if (!rule || rule.ownerId !== userId) throw new Error('Rule not found');
      return await prisma.automationRule.update({
        where: { id: input.id },
        data: { status: input.status || (rule.status === 'Active' ? 'Paused' : 'Active') }
      });
    }
    if (path === 'automations.remove') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      const rule = await prisma.automationRule.findUnique({ where: { id: input.id } });
      if (!rule || rule.ownerId !== userId) throw new Error('Rule not found');
      return await prisma.automationRule.delete({ where: { id: input.id } });
    }

    // ── WORKFLOWS (onboarding / offboarding / probation / severance) ──
    if (path === 'workflows.createTask') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId || !input?.task) throw new Error('Missing fields');
      return await prisma.onboardingTask.create({
        data: { title: input.task, userId: input.userId, creatorId: userId!, category: input.category || 'Onboarding' }
      });
    }
    if (path === 'workflows.toggleTask') {
      if (!userId) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      const task = await prisma.onboardingTask.findUnique({ where: { id: input.id } });
      if (!task) throw new Error('Task not found');
      if (task.userId !== userId && !isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized');
      return await prisma.onboardingTask.update({ where: { id: input.id }, data: { isCompleted: !!input.isCompleted } });
    }
    if (path === 'workflows.triggerProbationPlan') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId) throw new Error('Missing userId');
      const plan = ['30-Day Check-in', '60-Day Check-in', '90-Day Performance Review'];
      await prisma.onboardingTask.createMany({
        data: plan.map((t) => ({ title: t, userId: input.userId, creatorId: userId!, category: 'Probation' }))
      });
      return { success: true };
    }
    if (path === 'workflows.triggerOffboarding') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId) throw new Error('Missing userId');
      const target = await prisma.user.findUnique({ where: { id: input.userId } });
      if (!target) throw new Error('User not found');
      if (target.isOwner) throw new Error('Cannot offboard the system owner');
      // Mark terminated and open a high-priority IT asset reclamation ticket.
      await prisma.user.update({ where: { id: input.userId }, data: { status: 'Terminated' } });
      await prisma.ticket.create({
        data: { subject: `Offboarding: reclaim assets for ${target.name}`, priority: 'Critical', status: 'Open', userId: input.userId }
      });
      return { success: true };
    }
    if (path === 'workflows.finalizeSeverance') {
      if (!isAdmin && !isCEO) throw new MutationError('UNAUTHORIZED', 'Unauthorized: admins only');
      if (!input?.userId) throw new Error('Missing userId');
      const activeAssets = await prisma.asset.count({ where: { userId: input.userId, status: 'Active' } });
      if (activeAssets > 0) {
        throw new Error(`Cannot finalize: ${activeAssets} active asset(s) still assigned. Reclaim them first.`);
      }
      // In a real system this would trigger a payout. Here we just confirm.
      return { success: true, message: 'Severance released. All assets reclaimed.' };
    }

    throw new MutationError('NOT_FOUND', `Unknown mutation: ${path}`);
  } catch (error: any) {
    const typed = error instanceof MutationError ? error : classifyError(error);
    // Surface to observability with structured context (not a raw console dump).
    Sentry.captureException(typed, { extra: { path, code: typed.code } });
    throw typed;
  }
}

/**
 * revalidateForPath — After a successful mutation, purge the Next.js data
 * cache for the routes that render the affected domain so the UI reflects the
 * write immediately (otherwise a user "saves" but still sees stale data).
 *
 * Routes are derived from the mutation `path` prefix (e.g. `leave.*` → /leave).
 * We revalidate both the domain route and the dashboard, which aggregates
 * counts from every domain.
 */
function revalidateForPath(path: string) {
  const domain = path.split('.')[0];
  const routeMap: Record<string, string[]> = {
    profile: ['/profile', '/team', '/hierarchy', '/org-chart'],
    registry: ['/registry', '/team', '/hierarchy', '/org-chart'],
    attendance: ['/attendance', '/dashboard'],
    leave: ['/leave', '/dashboard', '/team'],
    payroll: ['/payroll', '/payroll-settings', '/dashboard'],
    performance: ['/performance', '/reviews', '/dashboard'],
    recruitment: ['/recruitment', '/dashboard'],
    expenses: ['/expenses', '/dashboard'],
    assets: ['/assets', '/dashboard'],
    benefits: ['/benefits', '/dashboard'],
    announcements: ['/announcements', '/dashboard'],
    calendar: ['/calendar', '/dashboard'],
    documents: ['/documents'],
    shifts: ['/shifts', '/attendance', '/dashboard'],
    training: ['/training', '/lms'],
    helpdesk: ['/helpdesk'],
    audit: ['/audit'],
    hierarchy: ['/hierarchy', '/org-chart', '/team'],
    onboarding: ['/onboarding', '/dashboard'],
    recognition: ['/recognition', '/dashboard'],
    compliance: ['/compliance', '/dashboard'],
    workflow: ['/team', '/dashboard'],
    automation: ['/automations'],
    notifications: ['/dashboard'],
    news: ['/dashboard'],
    invitations: ['/registry', '/team'],
    branch: ['/dashboard', '/team', '/registry'],
    delegation: ['/profile', '/settings'],
  };
  const routes = routeMap[domain] ?? ['/dashboard'];
  for (const route of routes) {
    try {
      revalidatePath(route);
    } catch {
      // revalidatePath is a no-op outside a request scope; ignore.
    }
  }
}

/**
 * Public entry point for client-side mutations. Dispatches the write via
 * runMutation, then revalidates the affected routes so the change is visible
 * without a full page reload.
 */
export async function executeServerMutation(path: string, input: any) {
  const result = await runMutation(path, input);
  revalidateForPath(path);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Automation engine (Pillar 4) — implementation lives in src/server/automation.ts
// so this file stays focused on query/mutation dispatch. Re-exported for the
// existing callers that import it from @/app/actions/db.
// ─────────────────────────────────────────────────────────────────────────────
export { runAutomationRules };
