import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const departmentsRouter = router({
  getDepartments: protectedProcedure.query(async ({ ctx }) => {
    return prisma.department.findMany({
      include: { 
        head: true,
        users: true 
      },
      orderBy: { name: 'asc' }
    });
  }),

  createDepartment: protectedProcedure
    .input(z.object({
      name: z.string(),
      budget: z.number(),
      headId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin') {
        throw new Error('Unauthorized');
      }

      return prisma.department.create({
        data: {
          name: input.name,
          budget: input.budget,
          headId: input.headId || null
        }
      });
    }),

  assignUserToDepartment: protectedProcedure
    .input(z.object({
      userId: z.string(),
      departmentId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });

      return prisma.user.update({
        where: { id: input.userId },
        data: { 
          departmentRefId: input.departmentId,
          department: dept?.name // keep legacy string synced just in case
        }
      });
    })
});
