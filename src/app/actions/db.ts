'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { canModifyUser } from '@/lib/hierarchy';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Helper to get authenticated user id and role
async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return dbUser;
}

// Helper: check if user can manage news
function canManageNews(caller: any, newsAuthorId: string): boolean {
  if (!caller) return false;
  const isCEO = (caller.designation || '').toLowerCase().includes('ceo') || caller.isOwner;
  const isAdminOrHR = caller.role === 'Admin' || caller.role === 'HR Manager';
  const isAuthor = caller.id === newsAuthorId;
  return isCEO || isAdminOrHR || isAuthor;
}

// Helper: check if user can create news
function canCreateNews(caller: any): boolean {
  if (!caller) return false;
  const isCEO = (caller.designation || '').toLowerCase().includes('ceo') || caller.isOwner;
  const isAdminOrHR = caller.role === 'Admin' || caller.role === 'HR Manager';
  const isManager = caller.role === 'Manager';
  return isCEO || isAdminOrHR || isManager;
}

export async function executeServerQuery(path: string, args?: any) {
  try {
    const caller = await getAuthUser();
    const isAdmin = caller && (caller.role === 'Admin' || caller.role === 'HR Manager');
    const isCEO = caller && ((caller.designation || '').toLowerCase().includes('ceo') || caller.isOwner);
    const userId = caller?.id;

    // ── DASHBOARD (Enhanced) ──
    if (path === 'dashboard.getStats') {
      const headcount = await prisma.user.count();
      const pendingApps = await prisma.leaveRequest.count({ where: { status: 'Pending' } });
      const totalPayrollResult = await prisma.payroll.aggregate({ _sum: { totalAmount: true } });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const presentToday = await prisma.attendance.count({ where: { date: { gte: today } } });
      const activeToday = headcount > 0 ? `${Math.round((presentToday / headcount) * 100)}%` : '0%';
      return { headcount, pendingApps, activeToday, totalPayroll: totalPayrollResult._sum.totalAmount || 0 };
    }

    if (path === 'dashboard.getFullStats') {
      const headcount = await prisma.user.count();
      const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'Pending' } });
      const approvedLeaves = await prisma.leaveRequest.count({ where: { status: 'Approved' } });
      const rejectedLeaves = await prisma.leaveRequest.count({ where: { status: 'Rejected' } });
      const totalPayrollResult = await prisma.payroll.aggregate({ _sum: { totalAmount: true } });
      const totalExpenseResult = await prisma.expense.aggregate({ _sum: { amount: true } });
      const pendingExpenses = await prisma.expense.count({ where: { status: 'PENDING' } });
      const openTickets = await prisma.ticket.count({ where: { status: 'Open' } });

      // Attendance for the last 7 days
      const attendanceTrend = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = await prisma.attendance.count({
          where: { date: { gte: day, lt: nextDay } }
        });
        attendanceTrend.push({
          day: day.toLocaleDateString('en', { weekday: 'short' }),
          date: day.toISOString(),
          present: count,
          rate: headcount > 0 ? Math.round((count / headcount) * 100) : 0
        });
      }

      // Department breakdown
      const allUsers = await prisma.user.findMany({ select: { department: true } });
      const deptMap: Record<string, number> = {};
      allUsers.forEach(u => {
        const dept = u.department || 'Unassigned';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });
      const departmentBreakdown = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

      // Leave breakdown by type
      const allLeaves = await prisma.leaveRequest.findMany({ select: { type: true } });
      const leaveTypeMap: Record<string, number> = {};
      allLeaves.forEach(l => {
        leaveTypeMap[l.type] = (leaveTypeMap[l.type] || 0) + 1;
      });
      const leaveBreakdown = Object.entries(leaveTypeMap).map(([type, count]) => ({ type, count }));

      // Task stats
      const totalTasks = await prisma.teamTask.count();
      const doneTasks = await prisma.teamTask.count({ where: { status: 'Done' } });
      const inProgressTasks = await prisma.teamTask.count({ where: { status: 'InProgress' } });
      const blockedTasks = await prisma.teamTask.count({ where: { status: 'Blocked' } });

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentHires = await prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
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
      const allExpenses = await prisma.expense.findMany({ select: { category: true, amount: true, status: true } });
      const expenseCatMap: Record<string, number> = {};
      allExpenses.forEach(e => {
        expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
      });
      const expenseBreakdown = Object.entries(expenseCatMap).map(([category, amount]) => ({ category, amount: Math.round(amount) }));

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const presentToday = await prisma.attendance.count({ where: { date: { gte: today } } });
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
      return await prisma.user.findMany({ include: { manager: true }, orderBy: { name: 'asc' } });
    }

    // ── ORG CHART ──
    if (path === 'orgchart.getOrgData' || path === 'orgchart.getTree' || path === 'team.getOrgChart') {
      const users = await prisma.user.findMany();
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
          if (!root || u.role === 'Admin' || u.designation === 'CEO') {
            root = userMap[u.id];
          }
        }
      });
      return root || { ...users[0], children: [] };
    }

    // ── TEAM (Enhanced - Chain of Command) ──
    if (path === 'team.getMyTeam') {
      if (isAdmin || isCEO) {
        const directReports = await prisma.user.findMany();
        return { teamId: 'all', directReports };
      }
      const directReports = await prisma.user.findMany({ where: { managerId: userId } });
      return { teamId: 'my_team', directReports };
    }

    if (path === 'team.getChainOfCommand') {
      if (!userId) return { chain: [], directReports: [], peers: [] };
      
      // Get upward chain (me → manager → manager's manager → ... → CEO)
      const chain: any[] = [];
      let currentUser = caller;
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
        memberIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);
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
        const logs = await prisma.attendance.findMany({ include: { user: true }, orderBy: { date: 'desc' }, take: 100 });
        return logs.map(l => ({ ...l, userName: l.user.name }));
      }
      const logs = await prisma.attendance.findMany({ where: { userId }, include: { user: true }, orderBy: { date: 'desc' }, take: 50 });
      return logs.map(l => ({ ...l, userName: l.user.name }));
    }
    if (path === 'attendance.getAdminStats') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const onShift = await prisma.attendance.count({ where: { date: { gte: today }, clockOut: null } });
      const lateArrivals = await prisma.attendance.count({ where: { date: { gte: today }, status: 'Late' } });
      const absent = await prisma.attendance.count({ where: { date: { gte: today }, status: 'Absent' } });
      const totalEmployees = await prisma.user.count();
      return { onShift, lateArrivals, absent, totalEmployees };
    }

    // ── LEAVE ──
    if (path === 'leave.getRequests') {
      if (isAdmin) {
        return await prisma.leaveRequest.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
      }
      return await prisma.leaveRequest.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }

    // ── PAYROLL ──
    if (path === 'payroll.getPayrolls') {
      if (isAdmin) {
        return await prisma.payroll.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
      }
      return await prisma.payroll.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }
    if (path === 'payroll.getHeads') return await prisma.salaryHead.findMany();
    if (path === 'payroll.getAdminStats') {
      const totalPayroll = await prisma.payroll.aggregate({ _sum: { totalAmount: true } });
      const employeeCount = await prisma.user.count();
      const lastRun = await prisma.payroll.findFirst({ orderBy: { createdAt: 'desc' } });
      return {
        totalYTD: totalPayroll._sum.totalAmount || 0,
        employeeCount,
        lastRunMonth: lastRun ? `${lastRun.month} ${lastRun.year}` : 'Never',
        lastRunStatus: lastRun?.status || 'N/A'
      };
    }

    // ── EXPENSES ──
    if (path === 'expenses.getAll' || path === 'expenses.getMyExpenses') {
      if (isAdmin) return await prisma.expense.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
      return await prisma.expense.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }

    // ── ASSETS ──
    if (path === 'assets.getAssets') return await prisma.asset.findMany({ include: { user: true } });

    // ── HELPDESK ──
    if (path === 'helpdesk.getTickets') {
      if (isAdmin) return await prisma.ticket.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
      return await prisma.ticket.findMany({ where: { userId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    }

    // ── APPLICATIONS (Leave Requests for Admin) ──
    if (path === 'applications.list') {
      return await prisma.leaveRequest.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
    }

    // ── DEPARTMENTS ──
    if (path === 'departments.getDepartments') return await prisma.department.findMany();

    // ── AUDIT ──
    if (path === 'audit.getLogs') {
      const events = await prisma.event.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
      // Event actorId is a string, let's fetch the users to map them
      const userIds = [...new Set(events.map(e => e.actorId))];
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, role: true } });
      const userMap = users.reduce((acc: any, u) => { acc[u.id] = u; return acc; }, {});
      return events.map(e => ({ ...e, actorName: userMap[e.actorId]?.name || 'System', actorRole: userMap[e.actorId]?.role || 'N/A' }));
    }

    // ── NOTIFICATIONS ──
    if (path === 'notifications.getAll') {
      if (!userId) return [];
      return await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    }

    // ── ENGAGEMENT (recent events) ──
    if (path === 'engagement.getRecent') {
      const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, createdAt: true, designation: true } });
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

    // ── BENEFITS / RECOGNITION / FEEDBACK / DOCUMENTS / COMPLIANCE / RECRUITMENT ──
    if (path === 'benefits.getEmployeeBenefits') return [];
    if (path === 'benefits.getEquityGrants') return [];
    if (path === 'benefits.getActiveEnrollmentPeriod') return null;
    if (path === 'recognition.getRecentKudos') return [];
    if (path === 'feedback.getAllFeedback') return [];
    if (path === 'documents.getDocuments') return [];
    if (path === 'compliance.getExpiringCertifications') return [];
    if (path === 'compliance.getMyCertifications') return [];
    if (path === 'compliance.getWhistleblowerReports') return [];
    if (path === 'recruitment.getJobs') return [];

    return [];
  } catch (error: any) {
    console.error(`Error executing ${path}:`, error);
    throw new Error(error.message);
  }
}

export async function executeServerMutation(path: string, input: any) {
  try {
    const caller = await getAuthUser();
    const isAdmin = caller && (caller.role === 'Admin' || caller.role === 'HR Manager');
    const isCEO = caller && ((caller.designation || '').toLowerCase().includes('ceo') || caller.isOwner);
    const userId = caller?.id;

    // ── PROFILE (Self) ──
    if (path === 'profile.updateMyProfile') {
      if (!userId) throw new Error('Unauthorized');

      // Editable self fields (position/role are NOT editable)
      const data: any = input?.data || {};
      const updateData: any = {
        name: data.name,
        department: data.department,
        designation: data.designation,
        avatarUrl: data.avatarUrl,
        status: data.status,
      };

      // Prevent updating protected fields even if client sends them
      delete updateData.role;
      delete updateData.empId;
      delete updateData.managerId;
      delete updateData.manager;
      delete updateData.isOnboarded;

      // Remove undefined keys
      Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

      return await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // ── REGISTRY ──
    if (path === 'registry.createEmployee') {
      return await prisma.user.create({ data: input });
    }
    if (path === 'registry.updateEmployee') {
      return await prisma.user.update({ where: { id: input.id }, data: input.data });
    }
    if (path === 'registry.deleteEmployee') {
      const targetUser = await prisma.user.findUnique({ where: { id: input.id } });
      const freshCaller = caller ? await prisma.user.findUnique({ where: { id: caller.id } }) : null;
      if (!targetUser) throw new Error('User not found');
      if (!freshCaller || !canModifyUser(freshCaller, targetUser)) {
        throw new Error('Unauthorized: You do not have permission to remove this user.');
      }
      
      // Delete related records (cascade doesn't always handle supabase auth)
      await prisma.attendance.deleteMany({ where: { userId: input.id } });
      await prisma.leaveRequest.deleteMany({ where: { userId: input.id } });
      await prisma.payroll.deleteMany({ where: { userId: input.id } });
      await prisma.expense.deleteMany({ where: { userId: input.id } });
      await prisma.ticket.deleteMany({ where: { userId: input.id } });
      await prisma.notification.deleteMany({ where: { userId: input.id } });
      
      await prisma.user.updateMany({
        where: { managerId: input.id },
        data: { managerId: null }
      });
      
      return await prisma.user.delete({ where: { id: input.id } });
    }
    if (path === 'registry.updatePermissions') {
      return await prisma.user.update({ where: { id: input.userId }, data: { status: 'active' } });
    }

    // ── ATTENDANCE ──
    if (path === 'attendance.clockIn') {
      if (!userId) throw new Error('Unauthorized');
      const now = new Date();
      const hour = now.getHours();
      const status = hour > 9 ? 'Late' : 'Present';
      const record = await prisma.attendance.create({
        data: {
          userId,
          date: now,
          status,
          clockIn: now,
          location: input?.location || null,
        }
      });
      return record;
    }
    if (path === 'attendance.clockOut') {
      if (!userId) throw new Error('Unauthorized');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const record = await prisma.attendance.findFirst({
        where: { userId, date: { gte: today }, clockOut: null },
        orderBy: { clockIn: 'desc' }
      });
      if (!record) throw new Error('No active clock-in found');
      return await prisma.attendance.update({
        where: { id: record.id },
        data: { clockOut: new Date() }
      });
    }

    // ── LEAVE ──
    if (path === 'leave.submitRequest') {
      if (!userId) throw new Error('Unauthorized');
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
      // Notify all admins
      const admins = await prisma.user.findMany({ where: { role: { in: ['Admin', 'HR Manager'] } } });
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
            console.error('Push notification failed for admin', admin.id, pushErr);
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
      return await prisma.salaryHead.create({ data: input });
    }

    // ── EXPENSES ──
    if (path === 'expenses.createExpense') {
      if (!userId) throw new Error('Unauthorized');
      return await prisma.expense.create({ data: { ...input, userId } });
    }

    // ── NOTIFICATIONS ──
    if (path === 'notifications.markRead') {
      return await prisma.notification.update({ where: { id: input.id }, data: { read: true } });
    }
    if (path === 'notifications.markAllRead') {
      if (!userId) throw new Error('Unauthorized');
      return await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    }
    if (path === 'notifications.savePushSub') {
      if (!userId) throw new Error('Unauthorized');
      return await prisma.user.update({
        where: { id: userId },
        data: { pushSub: input.subscription }
      });
    }
    if (path === 'notifications.removePushSub') {
      if (!userId) throw new Error('Unauthorized');
      return await prisma.user.update({
        where: { id: userId },
        data: { pushSub: null }
      });
    }

    // ── APPLICATIONS ──
    if (path === 'applications.submit') {
      if (!userId) throw new Error('Unauthorized');
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
        targetUsers = await prisma.user.findMany({ where: { department: input.targetTeam, NOT: { id: userId } } });
      } else {
        targetUsers = await prisma.user.findMany({ where: { NOT: { id: userId } } });
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
      if (!userId) throw new Error('Unauthorized');
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
      if (!userId) throw new Error('Unauthorized');
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
      if (!userId) throw new Error('Unauthorized');
      
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
      if (!userId) throw new Error('Unauthorized');
      const task = await prisma.teamTask.findUnique({ where: { id: input.id } });
      if (!task) throw new Error('Task not found');
      
      // Only assignee or assigner can update
      if (task.assigneeId !== userId && task.assignerId !== userId && !isAdmin && !isCEO) {
        throw new Error('Unauthorized');
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
      if (!userId) throw new Error('Unauthorized');
      const task = await prisma.teamTask.findUnique({ where: { id: input.id } });
      if (!task) throw new Error('Task not found');
      if (task.assignerId !== userId && !isAdmin && !isCEO) throw new Error('Unauthorized');
      return await prisma.teamTask.delete({ where: { id: input.id } });
    }

    // ── CALENDAR EVENTS CRUD ──
    if (path === 'calendar.createEvent') {
      if (!userId) throw new Error('Unauthorized');

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
        const teamMembers = await prisma.user.findMany({ where: { department: input.targetTeam, NOT: { id: userId } } });
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
      if (!userId) throw new Error('Unauthorized');
      const event = await prisma.calendarEvent.findUnique({ where: { id: input.id } });
      if (!event) throw new Error('Event not found');
      if (event.creatorId !== userId && !isAdmin && !isCEO) throw new Error('Unauthorized');

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
      if (!userId) throw new Error('Unauthorized');
      const event = await prisma.calendarEvent.findUnique({ where: { id: input.id } });
      if (!event) throw new Error('Event not found');
      if (event.creatorId !== userId && !isAdmin && !isCEO) throw new Error('Unauthorized');
      return await prisma.calendarEvent.delete({ where: { id: input.id } });
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Error executing mutation ${path}:`, error);
    throw new Error(error.message);
  }
}
