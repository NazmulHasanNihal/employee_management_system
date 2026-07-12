import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const benefitsRouter = router({
  getEmployeeBenefits: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.session.user.id;
      
      if (targetUserId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
          throw new Error('Unauthorized');
        }
      }

      return prisma.employeeBenefit.findMany({
        where: { userId: targetUserId, status: 'Active' },
        include: { benefit: true }
      });
    }),

  getEquityGrants: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.session.user.id;
      
      if (targetUserId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
          throw new Error('Unauthorized');
        }
      }

      return prisma.equityGrant.findMany({
        where: { userId: targetUserId },
        orderBy: { grantedDate: 'desc' }
      });
    }),

  getAllBenefits: protectedProcedure.query(async ({ ctx }) => {
    const caller = ctx.session.user as any;
    if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
      throw new Error('Unauthorized');
    }
    return prisma.benefit.findMany();
  }),

  assignBenefit: protectedProcedure
    .input(z.object({
      userId: z.string(),
      benefitId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      // --- Time-Locked Benefits Enrollment ---
      const activePeriod = await prisma.enrollmentPeriod.findFirst({
        where: {
          status: 'Active',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });

      if (!activePeriod) {
        throw new Error('Benefits Enrollment is currently closed. You can only assign benefits during an active open enrollment period.');
      }

      return prisma.employeeBenefit.create({
        data: {
          userId: input.userId,
          benefitId: input.benefitId
        }
      });
    }),

  grantEquity: protectedProcedure
    .input(z.object({
      userId: z.string(),
      shares: z.number().int().positive(),
      vestingYears: z.number().int().positive()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.equityGrant.create({
        data: {
          userId: input.userId,
          shares: input.shares,
          vestingYears: input.vestingYears
        }
      });
    }),

  getActiveEnrollmentPeriod: protectedProcedure.query(async () => {
    return prisma.enrollmentPeriod.findFirst({
      where: {
        status: 'Active',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });
  })
});
