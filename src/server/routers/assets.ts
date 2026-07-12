import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const assetsRouter = router({
  getAssets: protectedProcedure.query(async ({ ctx }) => {
    // If admin or has MANAGE_ASSETS permission, see all assets
    const isAdmin = ctx.session.user.role === 'Admin' || 
                    (ctx.session.user as any).permissions?.includes('MANAGE_ASSETS');

    if (isAdmin) {
      return prisma.asset.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Regular users see only their assigned assets
    return prisma.asset.findMany({
      where: { userId: ctx.session.user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
  }),

  createAsset: protectedProcedure
    .input(z.object({
      name: z.string(),
      status: z.string(),
      userId: z.string().optional(),
      purchasePrice: z.number().optional(),
      purchaseDate: z.date().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === 'Admin' || 
                      (ctx.session.user as any).permissions?.includes('MANAGE_ASSETS');
      if (!isAdmin) throw new Error('Unauthorized');

      return prisma.asset.create({
        data: {
          name: input.name,
          status: input.status,
          userId: input.userId || null,
          purchasePrice: input.purchasePrice,
          purchaseDate: input.purchaseDate
        }
      });
    }),

  updateAsset: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string(),
      userId: z.string().nullable()
    }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === 'Admin' || 
                      (ctx.session.user as any).permissions?.includes('MANAGE_ASSETS');
      if (!isAdmin) throw new Error('Unauthorized');

      return prisma.asset.update({
        where: { id: input.id },
        data: {
          status: input.status,
          userId: input.userId
        }
      });
    }),

  deleteAsset: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === 'Admin' || 
                      (ctx.session.user as any).permissions?.includes('MANAGE_ASSETS');
      if (!isAdmin) throw new Error('Unauthorized');

      return prisma.asset.delete({
        where: { id: input.id }
      });
    })
});
