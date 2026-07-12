import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const registryRouter = router({
  searchEmployees: publicProcedure
    .input(z.object({
      query: z.string().optional()
    }))
    .query(async ({ input }) => {
      return prisma.user.findMany({
        where: input.query ? {
          OR: [
            { name: { contains: input.query } },
            { department: { contains: input.query } },
            { designation: { contains: input.query } }
          ]
        } : undefined,
        orderBy: { name: 'asc' }
      });
    }),

  updateManager: protectedProcedure
    .input(z.object({
      userId: z.string(),
      managerId: z.string().nullable()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }
      return prisma.user.update({
        where: { id: input.userId },
        data: { managerId: input.managerId }
      });
    }),

  updatePermissions: protectedProcedure
    .input(z.object({
      userId: z.string(),
      permissions: z.array(z.string()) // e.g. ["MANAGE_ASSETS", "MANAGE_TRAINING"]
    }))
    .mutation(async ({ ctx, input }) => {
      // Only true Admins can change granular permissions
      if (ctx.session.user.role !== 'Admin') {
        throw new Error('Unauthorized');
      }
      return prisma.user.update({
        where: { id: input.userId },
        data: { permissions: JSON.stringify(input.permissions) }
      });
    }),

  updateCurrency: protectedProcedure
    .input(z.object({
      userId: z.string(),
      currency: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin') {
        throw new Error('Unauthorized');
      }
      return prisma.user.update({
        where: { id: input.userId },
        data: { currency: input.currency }
      });
    }),

  updatePayrollStructure: protectedProcedure
    .input(z.object({
      userId: z.string(),
      structureId: z.string().nullable()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }
      return prisma.user.update({
        where: { id: input.userId },
        data: { payrollStructureId: input.structureId }
      });
    })
});
