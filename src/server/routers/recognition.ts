import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const recognitionRouter = router({
  sendKudo: protectedProcedure
    .input(z.object({
      receiverId: z.string(),
      message: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.receiverId === ctx.session.user.id) {
        throw new Error('Cannot send a kudo to yourself');
      }

      return prisma.kudo.create({
        data: {
          senderId: ctx.session.user.id,
          receiverId: input.receiverId,
          message: input.message
        }
      });
    }),

  getRecentKudos: protectedProcedure
    .query(async () => {
      return prisma.kudo.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { name: true, department: true } },
          receiver: { select: { name: true, department: true } }
        }
      });
    })
});
