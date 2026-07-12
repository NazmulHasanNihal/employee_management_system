import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const applicationsRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input }) => {
      return prisma.application.findMany({
        where: input.userId ? { userId: input.userId } : undefined,
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
    }),

  submit: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.string(),
      details: z.string()
    }))
    .mutation(async ({ input }) => {
      return prisma.application.create({
        data: {
          userId: input.userId,
          type: input.type,
          details: input.details,
          status: 'Pending Manager'
        }
      });
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.string()
    }))
    .mutation(async ({ input }) => {
      return prisma.application.update({
        where: { id: input.id },
        data: { status: input.status }
      });
    })
});
