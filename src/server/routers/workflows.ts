import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const workflowsRouter = router({
  getOnboardingTasks: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.session.user.id;
      
      if (targetUserId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'HR Manager' && caller.role !== 'Manager') {
          throw new Error('Unauthorized');
        }
      }

      return prisma.onboardingTask.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'asc' }
      });
    }),

  createTask: protectedProcedure
    .input(z.object({
      userId: z.string(),
      task: z.string(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager' && caller.role !== 'Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.onboardingTask.create({
        data: input
      });
    }),

  toggleTask: protectedProcedure
    .input(z.object({ id: z.string(), isCompleted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.onboardingTask.findUnique({ where: { id: input.id } });
      if (!task) throw new Error('Not found');

      if (task.userId !== ctx.session.user.id) {
        const caller = ctx.session.user as any;
        if (caller.role !== 'Admin' && caller.role !== 'HR Manager' && caller.role !== 'Manager') {
          throw new Error('Unauthorized');
        }
      }

      return prisma.onboardingTask.update({
        where: { id: input.id },
        data: { isCompleted: input.isCompleted }
      });
    }),

  triggerProbationPlan: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      await prisma.onboardingTask.createMany({
        data: [
          { userId: input.userId, task: '30-Day Performance Check-in' },
          { userId: input.userId, task: '60-Day Performance Check-in' },
          { userId: input.userId, task: '90-Day Final Probation Review' }
        ]
      });

      // --- Zero-Touch App Provisioning (Mock) ---
      const activeIntegrations = await prisma.appIntegration.findMany({
        where: { isActive: true, tenantId: caller.tenantId }
      });
      
      for (const integration of activeIntegrations) {
        await prisma.appProvision.create({
          data: {
            integrationId: integration.id,
            userId: input.userId,
            status: 'Provisioned',
            externalId: `mock-${integration.appName.toLowerCase()}-${input.userId}`
          }
        });
      }

      return { success: true };
    }),

  triggerOffboarding: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      // 1. Change user status to Terminated
      await prisma.user.update({
        where: { id: input.userId },
        data: { status: 'Terminated' }
      });

      // 2. Automatically create an IT ticket to reclaim assets
      await prisma.ticket.create({
        data: {
          userId: input.userId,
          subject: 'AUTOMATED: Reclaim IT Assets for Terminated Employee',
          priority: 'High',
          status: 'Open'
        }
      });

      // --- Zero-Touch App Revocation (Mock) ---
      const activeProvisions = await prisma.appProvision.findMany({
        where: { userId: input.userId }
      });
      
      for (const provision of activeProvisions) {
        await prisma.appProvision.update({
          where: { id: provision.id },
          data: { status: 'Revoked' }
        });
      }

      return { success: true };
    }),

  finalizeSeverance: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      const activeAssets = await prisma.asset.findMany({
        where: { userId: input.userId }
      });

      const activeUnreturned = activeAssets.filter(a => a.status !== 'Damaged');
      if (activeUnreturned.length > 0) {
        throw new Error(`OFFBOARDING RANSOM TRIGGERED: Cannot finalize severance. User still has ${activeUnreturned.length} active IT assets. IT must unassign these first.`);
      }

      const damagedAssets = activeAssets.filter(a => a.status === 'Damaged');
      let deduction = 0;
      
      for (const asset of damagedAssets) {
        if (asset.purchasePrice && asset.purchaseDate) {
          const yearsOld = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
          let remainingValue = asset.purchasePrice - (asset.purchasePrice / asset.depreciationYears) * yearsOld;
          if (remainingValue < 0) remainingValue = 0;
          deduction += remainingValue;
        }
      }

      return { 
        success: true, 
        message: deduction > 0 
          ? `Severance finalized with a $${deduction.toFixed(2)} deduction for damaged assets.` 
          : 'Severance finalized and released.' 
      };
    })
});
