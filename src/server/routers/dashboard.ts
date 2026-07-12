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

    return {
      headcount,
      activeToday: `${activePercentage}%`,
      pendingApps,
      sysHealth: '100%',
    };
  }),

  getUserStats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId }
      });
      return {
        okr: 78, // Mocked for now
        pulse: null,
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
