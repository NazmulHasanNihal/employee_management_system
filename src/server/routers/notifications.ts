import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const notificationsRouter = router({
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return prisma.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.notification.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { read: true }
      });
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return prisma.notification.updateMany({
      where: { userId: ctx.session.user.id, read: false },
      data: { read: true }
    });
  })
});
