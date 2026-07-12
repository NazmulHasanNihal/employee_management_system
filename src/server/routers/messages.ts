import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const messagesRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Get all users who we have exchanged messages with
    const sent = await prisma.directMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true }
    });
    const received = await prisma.directMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true }
    });

    const userIds = new Set([
      ...sent.map(m => m.receiverId),
      ...received.map(m => m.senderId)
    ]);

    if (userIds.size === 0) return [];

    return prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, role: true }
    });
  }),

  getMessages: protectedProcedure
    .input(z.object({ withUserId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const messages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: input.withUserId },
            { senderId: input.withUserId, receiverId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { name: true } } }
      });

      // Find burners that haven't been read by the current user
      const burnersToDelete = messages.filter(m => m.isBurner && m.receiverId === userId);
      if (burnersToDelete.length > 0) {
        // We delete them async, so they get to read it exactly once.
        prisma.directMessage.deleteMany({
          where: { id: { in: burnersToDelete.map(m => m.id) } }
        }).catch(console.error);
      }

      return messages;
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      receiverId: z.string(),
      content: z.string(),
      isBurner: z.boolean().optional().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const msg = await prisma.directMessage.create({
        data: {
          content: input.content,
          senderId: ctx.session.user.id,
          receiverId: input.receiverId,
          isBurner: input.isBurner
        },
        include: { sender: { select: { name: true } } }
      });
      
      // Also create a notification for the receiver
      await prisma.notification.create({
        data: {
          userId: input.receiverId,
          type: 'DM',
          message: `New message from ${msg.sender.name}`
        }
      });

      return msg;
    })
});
