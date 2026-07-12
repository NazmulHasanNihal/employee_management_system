import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const calendarRouter = router({
  getEvents: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.startDate) {
        where.date = { ...where.date, gte: input.startDate };
      }
      if (input?.endDate) {
        where.date = { ...where.date, lte: input.endDate };
      }
      return prisma.event.findMany({
        where,
        orderBy: { date: 'asc' }
      });
    }),

  createEvent: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.string().or(z.date()),
      type: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Only HR can create global events');
      }

      return prisma.event.create({
        data: {
          title: input.title,
          description: input.description,
          date: new Date(input.date),
          type: input.type
        }
      });
    })
});
