import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const documentsRouter = router({
  getDocuments: protectedProcedure.query(async ({ ctx }) => {
    // If admin/HR, see all documents. If employee, see only their own.
    if (ctx.session.user.role === 'Admin' || ctx.session.user.role === 'HR Manager') {
      return prisma.document.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
    }
    return prisma.document.findMany({
      where: { userId: ctx.session.user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
  }),

  createDocument: protectedProcedure
    .input(z.object({
      name: z.string(),
      userId: z.string(),
      url: z.string().optional(),
      requiresSignature: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }
      return prisma.document.create({
        data: {
          name: input.name,
          userId: input.userId,
          url: input.url,
          requiresSignature: input.requiresSignature
        }
      });
    }),

  signDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await prisma.document.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new Error('Not found');
      if (doc.userId !== ctx.session.user.id && ctx.session.user.role !== 'Admin') {
        throw new Error('Unauthorized');
      }
      return prisma.document.update({
        where: { id: input.documentId },
        data: {
          isSigned: true,
          signedAt: new Date()
        }
      });
    })
});
