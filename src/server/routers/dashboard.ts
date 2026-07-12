import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dashboardRouter = router({
  getTelemetry: publicProcedure.query(async () => {
    const headcount = await prisma.user.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeCount = await prisma.attendance.count({
      where: { date: { gte: today } }
    });
    const activePercentage = headcount > 0 ? Math.round((activeCount / headcount) * 100) : 0;

    const pendingApps = await prisma.application.count({
      where: { status: { contains: 'Pending' } }
    });

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const payrolls = await prisma.payroll.aggregate({
      where: { month: currentMonth },
      _sum: { net: true }
    });

    return {
      headcount,
      activeToday: `${activePercentage}%`,
      pendingApps,
      totalPayroll: payrolls._sum.net || 0,
      sysHealth: '100%',
    };
  }),

  getDepartmentBreakdown: publicProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: { department: true }
    });

    const breakdown: Record<string, number> = {};
    for (const u of users) {
      if (u.department) {
        breakdown[u.department] = (breakdown[u.department] || 0) + 1;
      }
    }

    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }),

  getAuditLogs: publicProcedure.query(async () => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    // Fetch users manually
    const userIds = [...new Set(logs.map(l => l.actor))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, email: true }
    });
    
    return logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.actor) || null
    }));
  }),

  getUserStats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId }
      });
      return {
        okr: user?.rpgLevel ? user.rpgLevel * 10 : 0, 
        pulse: user?.pulse || null,
        offlineQueue: 0
      };
    }),

  getAnnouncements: publicProcedure.query(async () => {
    return prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  })
});
