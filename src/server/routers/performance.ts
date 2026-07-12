import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const performanceRouter = router({
  getReviews: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.session.user.id;
      
      // If asking for someone else, ensure caller is Admin, HR, or Manager
      if (targetUserId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'HR Manager' && caller.role !== 'Manager') {
          throw new Error('Unauthorized to view these reviews');
        }
      }

      return prisma.performanceReview.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' }
      });
    }),

  createReview: protectedProcedure
    .input(z.object({
      userId: z.string(),
      score: z.number().min(0).max(100),
      feedback: z.string(),
      period: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager' && caller.role !== 'Manager') {
        throw new Error('Unauthorized to create reviews');
      }

      return prisma.performanceReview.create({
        data: input
      });
    }),

  getObjectives: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.session.user.id;
      return prisma.objective.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' }
      });
    }),

  createObjective: protectedProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Employees can create their own, or managers can create for them
      if (input.userId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'Manager') {
          throw new Error('Unauthorized');
        }
      }

      return prisma.objective.create({
        data: {
          userId: input.userId,
          title: input.title
        }
      });
    }),

  updateObjectiveProgress: protectedProcedure
    .input(z.object({
      id: z.string(),
      progress: z.number().min(0).max(100),
      status: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const objective = await prisma.objective.findUnique({ where: { id: input.id } });
      if (!objective) throw new Error('Not found');

      if (objective.userId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'Manager') throw new Error('Unauthorized');
      }

      return prisma.objective.update({
        where: { id: input.id },
        data: { progress: input.progress, status: input.status }
      });
    })
});
