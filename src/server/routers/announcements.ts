import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const announcementsRouter = router({
  getAll: protectedProcedure.query(async () => {
    return prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      priority: z.enum(['Low', 'Medium', 'High'])
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      const announcement = await prisma.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          priority: input.priority,
          author: ctx.session.user.name
        }
      });

      // Send a notification to all active users
      const users = await prisma.user.findMany({ select: { id: true } });
      await prisma.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          type: 'Announcement',
          message: `New ${input.priority} priority announcement: ${input.title}`
        }))
      });

      return announcement;
    })
});
