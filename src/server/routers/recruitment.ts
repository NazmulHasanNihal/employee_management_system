import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const recruitmentRouter = router({
  getJobs: protectedProcedure.query(async ({ ctx }) => {
    const caller = ctx.session.user as any;
    if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
      throw new Error('Unauthorized');
    }

    return prisma.jobPosting.findMany({
      include: { candidates: true },
      orderBy: { createdAt: 'desc' }
    });
  }),

  createJob: protectedProcedure
    .input(z.object({
      title: z.string(),
      department: z.string(),
      location: z.string(),
      type: z.string(),
      description: z.string(),
      requiredSkills: z.string().optional() // JSON array of skills
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.jobPosting.create({
        data: input
      });
    }),

  addCandidate: protectedProcedure
    .input(z.object({
      jobPostingId: z.string(),
      name: z.string(),
      email: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.candidate.create({
        data: input
      });
    }),

  updateCandidateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      return prisma.candidate.update({
        where: { id: input.id },
        data: { status: input.status }
      });
    }),

  findInternalMatches: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const caller = ctx.session.user as any;
      if (caller.role !== 'Admin' && caller.role !== 'HR Manager') {
        throw new Error('Unauthorized');
      }

      const job = await prisma.jobPosting.findUnique({ where: { id: input.jobId } });
      if (!job || !job.requiredSkills) return [];

      let requiredSkillsArr: string[] = [];
      try {
        requiredSkillsArr = JSON.parse(job.requiredSkills).map((s: string) => s.toLowerCase());
      } catch (e) {
        return [];
      }
      
      if (requiredSkillsArr.length === 0) return [];

      const employees = await prisma.user.findMany({
        where: { status: 'Active' },
        include: { skills: true }
      });

      const matches = employees.map(emp => {
        const empSkills = emp.skills.map(s => s.skill.toLowerCase());
        const matchedSkills = requiredSkillsArr.filter(rs => empSkills.includes(rs));
        const score = Math.round((matchedSkills.length / requiredSkillsArr.length) * 100);
        return {
          user: { id: emp.id, name: emp.name, department: emp.department },
          score,
          matchedSkills,
          missingSkills: requiredSkillsArr.filter(rs => !empSkills.includes(rs))
        };
      }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);

      return matches;
    })
});
