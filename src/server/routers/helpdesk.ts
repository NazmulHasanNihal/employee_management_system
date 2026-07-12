import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const helpdeskRouter = router({
  getTickets: protectedProcedure.query(async ({ ctx }) => {
    const caller = ctx.session.user as any;
    
    // HR/Admin sees all tickets, others see only theirs
    if (caller.role === 'Admin' || caller.role === 'HR Manager') {
      return prisma.ticket.findMany({
        include: { user: { select: { name: true, department: true } }, replies: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    return prisma.ticket.findMany({
      where: { userId: caller.id },
      include: { user: { select: { name: true, department: true } }, replies: true },
      orderBy: { createdAt: 'desc' }
    });
  }),

  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string(),
      priority: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.ticket.create({
        data: {
          userId: ctx.session.user.id,
          subject: input.subject,
          priority: input.priority
        }
      });
    }),

  addReply: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      message: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
      if (!ticket) throw new Error('Ticket not found');

      const caller = ctx.session.user as any;
      if (ticket.userId !== caller.id && caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.ticketReply.create({
        data: {
          ticketId: input.ticketId,
          userId: caller.id,
          message: input.message
        }
      });
    }),

  updateTicketStatus: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      status: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Only HR can update status');
      }

      return prisma.ticket.update({
        where: { id: input.ticketId },
        data: { status: input.status }
      });
    })
});
