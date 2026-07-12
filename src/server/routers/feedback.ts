import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const feedbackRouter = router({
  submitFeedback: protectedProcedure
    .input(z.object({
      category: z.string(),
      message: z.string(),
      isAnonymous: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.feedback.create({
        data: {
          category: input.category,
          message: input.message,
          userId: input.isAnonymous ? null : ctx.session.user.id
        }
      });
    }),

  getAllFeedback: protectedProcedure
    .query(async ({ ctx }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.feedback.findMany({
        include: { user: { select: { name: true, department: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }),

  updateFeedbackStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.feedback.update({
        where: { id: input.id },
        data: { status: input.status }
      });
    })
});
