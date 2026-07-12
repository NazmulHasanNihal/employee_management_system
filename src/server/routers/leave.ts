import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const leaveRouter = router({
  getRequests: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role === 'Admin' || ctx.session.user.role === 'HR Manager') {
      return prisma.leaveRequest.findMany({
        include: { user: true },
        orderBy: { startDate: 'desc' }
      });
    } else {
      return prisma.leaveRequest.findMany({
        where: { userId: ctx.session.user.id },
        include: { user: true },
        orderBy: { startDate: 'desc' }
      });
    }
  }),

  requestLeave: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      type: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      
      // --- Time-Off Overlap Preventer ---
      let warning: string | undefined = undefined;
      
      const me = await prisma.user.findUnique({
        where: { id: ctx.session.user.id }
      });
      
      if (me?.departmentRefId) {
        const totalDeptMembers = await prisma.user.count({
          where: { departmentRefId: me.departmentRefId }
        });
        
        const overlappingLeaves = await prisma.leaveRequest.findMany({
          where: {
            user: { departmentRefId: me.departmentRefId },
            status: { in: ['Approved', 'Pending'] },
            id: { not: undefined }, // just a placeholder
            OR: [
              { startDate: { lte: end }, endDate: { gte: start } }
            ]
          },
          select: { userId: true }
        });
        
        const uniqueAbsentees = new Set(overlappingLeaves.map(l => l.userId)).size;
        
        if (totalDeptMembers > 0 && (uniqueAbsentees / totalDeptMembers) > 0.2) {
          warning = `WARNING: ${uniqueAbsentees} out of ${totalDeptMembers} members in your department already have leave requested for these dates. Approval may be delayed.`;
        }
      }
      
      const req = await prisma.leaveRequest.create({
        data: {
          userId: ctx.session.user.id,
          startDate: start,
          endDate: end,
          type: input.type,
          reason: input.reason + (warning ? `\n\n[SYSTEM WARNING: ${warning}]` : '')
        }
      });

      // Find HR managers to notify
      const hrUsers = await prisma.user.findMany({
        where: { role: 'HR Manager' }
      });

      await prisma.notification.createMany({
        data: hrUsers.map(hr => ({
          userId: hr.id,
          type: 'Leave',
          message: `New leave request from ${ctx.session.user.name}`
        }))
      });

      return req;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['Approved', 'Rejected'])
    }))
    .mutation(async ({ ctx, input }) => {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: input.id },
        include: { user: true }
      });
      if (!leaveRequest) throw new Error('Not found');

      let canApprove = ctx.session.user.role === 'Admin' || ctx.session.user.role === 'HR Manager';

      if (!canApprove) {
        const managerId = leaveRequest.user.managerId;
        if (managerId === ctx.session.user.id) {
          canApprove = true;
        } else if (managerId) {
          const manager = await prisma.user.findUnique({ where: { id: managerId } });
          if (manager?.proxyId === ctx.session.user.id) {
            if (!manager.proxyValidUntil || manager.proxyValidUntil >= new Date()) {
              canApprove = true;
            }
          }
        }
      }

      if (!canApprove) {
        throw new Error('Unauthorized');
      }

      const req = await prisma.leaveRequest.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { user: true }
      });

      await prisma.notification.create({
        data: {
          userId: req.userId,
          type: 'Leave',
          message: `Your leave request for ${req.startDate.toLocaleDateString()} was ${input.status}`
        }
      });

      return req;
    })
});
