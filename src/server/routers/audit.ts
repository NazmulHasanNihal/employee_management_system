import { router, adminProcedure, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const auditRouter = router({
  getLogs: adminProcedure.query(async () => {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }),

  // Used internally by the system to log actions, exposed here for demonstration
  logAction: adminProcedure
    .input(z.object({
      actor: z.string(),
      action: z.string(),
      target: z.string(),
    }))
    .mutation(async ({ input }) => {
      const lastLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      const prevHash = lastLog ? lastLog.hash : ' genesis';
      // In a real system, use a crypto hash like SHA-256 over prevHash + actor + action + target + timestamp
      const hash = Math.random().toString(16).substring(2, 10); 

      return prisma.auditLog.create({
        data: {
          actor: input.actor,
          action: input.action,
          target: input.target,
          prevHash,
          hash
        }
      });
    }),
    
  logAnonymousTip: protectedProcedure
    .input(z.object({
      target: z.string(),
      details: z.string(),
    }))
    .mutation(async ({ input }) => {
      const prevLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      const prevHash = prevLog ? prevLog.hash : 'GENESIS_BLOCK';
      const hash = `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

      return prisma.auditLog.create({
        data: {
          actor: 'ANONYMOUS_SOURCE',
          action: `WHISTLEBLOWER_TIP: ${input.details.substring(0, 50)}...`,
          target: input.target,
          prevHash,
          hash
        }
      });
    })
});
