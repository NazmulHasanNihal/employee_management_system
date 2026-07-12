import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const profileRouter = router({
  getDocuments: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.role;
    const userId = ctx.session.user.id;
    
    if (userRole === 'Admin' || userRole === 'HR Manager') {
      return prisma.document.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return prisma.document.findMany({
        where: { userId },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  }),
  
  uploadDocument: protectedProcedure
    .input(z.object({
      name: z.string(),
      url: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.document.create({
        data: {
          name: input.name,
          url: input.url,
          userId: ctx.session.user.id,
        }
      });
    }),

  getSkills: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetUserId = input?.userId || ctx.session.user.id;
      return prisma.userSkill.findMany({
        where: { userId: targetUserId },
        orderBy: { level: 'desc' }
      });
    }),

  addSkill: protectedProcedure
    .input(z.object({ skill: z.string(), level: z.number().min(1).max(5).default(1) }))
    .mutation(async ({ ctx, input }) => {
      return prisma.userSkill.upsert({
        where: { userId_skill: { userId: ctx.session.user.id, skill: input.skill } },
        update: { level: input.level },
        create: {
          userId: ctx.session.user.id,
          skill: input.skill,
          level: input.level
        }
      });
    }),

  removeSkill: protectedProcedure
    .input(z.object({ skill: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.userSkill.delete({
        where: { userId_skill: { userId: ctx.session.user.id, skill: input.skill } }
      });
    })
});
