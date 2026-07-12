import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const complianceRouter = router({
  getMandatoryPolicies: protectedProcedure.query(async ({ ctx }) => {
    // Return all mandatory policies the user has NOT acknowledged
    const allMandatory = await prisma.companyPolicy.findMany({
      where: { isRequired: true }
    });

    const userAcks = await prisma.policyAcknowledgment.findMany({
      where: { userId: ctx.session.user.id }
    });

    const ackIds = new Set(userAcks.map(a => a.policyId));
    
    return allMandatory.filter(p => !ackIds.has(p.id));
  }),

  acknowledgePolicy: protectedProcedure
    .input(z.object({ policyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.policyAcknowledgment.create({
        data: {
          userId: ctx.session.user.id,
          policyId: input.policyId
        }
      });
    }),

  submitWhistleblower: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Create feedback without linking to user for anonymity
      return prisma.feedback.create({
        data: {
          category: 'Compliance',
          type: 'Whistleblower',
          message: input.message,
          // Deliberately DO NOT set userId
        }
      });
    }),

  getWhistleblowerReports: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== 'Admin') {
      throw new Error('Unauthorized');
    }
    return prisma.feedback.findMany({
      where: { type: 'Whistleblower' },
      orderBy: { createdAt: 'desc' }
    });
  }),

  getMyCertifications: protectedProcedure.query(async ({ ctx }) => {
    return prisma.certification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' }
    });
  }),

  addCertification: protectedProcedure
    .input(z.object({ name: z.string(), expiryDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.certification.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          expiryDate: new Date(input.expiryDate)
        }
      });
    }),

  getExpiringCertifications: protectedProcedure.query(async ({ ctx }) => {
    // Only Admin / HR Managers can see this for all users
    if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') {
      throw new Error('Unauthorized');
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return prisma.certification.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow, gte: new Date() }
      },
      include: { user: true },
      orderBy: { expiryDate: 'asc' }
    });
  })
});
