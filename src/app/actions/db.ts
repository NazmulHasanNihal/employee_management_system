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

export async function executeServerQuery(path: string, args?: any) {
  try {
    const caller = await getAuthUser();
    const isAdmin = caller && (caller.role === 'Admin' || caller.role === 'HR Manager');
    const userId = caller?.id;

    // ── DASHBOARD ──
    if (path === 'dashboard.getStats') {
      const headcount = await prisma.user.count();
      const pendingApps = await prisma.leaveRequest.count({ where: { status: 'Pending' } });
      const totalPayrollResult = await prisma.payroll.aggregate({ _sum: { totalAmount: true } });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const presentToday = await prisma.attendance.count({ where: { date: { gte: today } } });
      const activeToday = headcount > 0 ? `${Math.round((presentToday / headcount) * 100)}%` : '0%';
      return { headcount, pendingApps, activeToday, totalPayroll: totalPayrollResult._sum.totalAmount || 0 };
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
      users.forEach(u => {
        if (u.managerId && userMap[u.managerId]) {
          userMap[u.managerId].children.push(userMap[u.id]);
        } else if (!u.managerId) {
          root = userMap[u.id];
        }
      });
      return root || { ...users[0], children: [] };
    }

    // ── TEAM ──
    if (path === 'team.getMyTeam') {
      if (isAdmin) {
        const directReports = await prisma.user.findMany();
        return { teamId: 'all', directReports };
      }
      const directReports = await prisma.user.findMany({ where: { managerId: userId } });
      return { teamId: 'my_team', directReports };
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

    return { success: true };
  } catch (error: any) {
    console.error(`Error executing mutation ${path}:`, error);
    throw new Error(error.message);
  }
}
