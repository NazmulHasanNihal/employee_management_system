import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const teamRouter = router({
  getMyTeam: protectedProcedure.query(async ({ ctx }) => {
    const callerId = ctx.session.user.id;
    
    // Find users who have this caller as their manager, or if the caller is a department head, find users in that department
    const directReports = await prisma.user.findMany({
      where: { managerId: callerId },
      include: {
        attendances: { take: 5, orderBy: { date: 'desc' } },
        leaveRequests: { where: { status: 'Pending Manager' } },
        objectives: true
      }
    });

    const headedDepts = await prisma.department.findMany({
      where: { headId: callerId },
      include: { users: true }
    });

    return {
      directReports,
      headedDepts
    };
  }),

  setProxy: protectedProcedure
    .input(z.object({
      proxyId: z.string(),
      validUntil: z.date()
    }))
    .mutation(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id;
      
      return prisma.user.update({
        where: { id: callerId },
        data: {
          proxyId: input.proxyId,
          proxyValidUntil: input.validUntil
        }
      });
    }),

  clearProxy: protectedProcedure
    .mutation(async ({ ctx }) => {
      const callerId = ctx.session.user.id;
      
      return prisma.user.update({
        where: { id: callerId },
        data: {
          proxyId: null,
          proxyValidUntil: null
        }
      });
    }),

  getOrgChart: protectedProcedure.query(async ({ ctx }) => {
    // Generate React Flow nodes and edges for the whole company (or tenant)
    const users = await prisma.user.findMany({
      where: ctx.session.user.tenantId ? { tenantId: ctx.session.user.tenantId } : undefined,
      select: { id: true, name: true, designation: true, department: true, managerId: true, image: true }
    });

    const nodes = users.map(user => ({
      id: user.id,
      type: 'customUserNode',
      data: {
        label: user.name,
        designation: user.designation,
        department: user.department,
        image: user.image
      },
      position: { x: 0, y: 0 } // Positions will be calculated by a layout engine on frontend (e.g. dagre)
    }));

    const edges = users
      .filter(user => user.managerId)
      .map(user => ({
        id: `e-${user.managerId}-${user.id}`,
        source: user.managerId!,
        target: user.id,
        type: 'smoothstep',
        animated: true,
      }));

    return { nodes, edges };
  })
});
