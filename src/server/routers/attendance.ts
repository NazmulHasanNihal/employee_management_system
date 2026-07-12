import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const attendanceRouter = router({
  getLogs: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Admin sees all or specific user, normal user sees only theirs
      const targetUserId = (ctx.session.user.role === 'Admin' && input.userId) ? input.userId : ctx.session.user.id;
      
      if (ctx.session.user.role === 'Admin' && !input.userId) {
        return prisma.attendance.findMany({
          include: { user: true },
          orderBy: { date: 'desc' },
          take: 100 // limit to recent for admin view
        });
      }

      return prisma.attendance.findMany({
        where: { userId: targetUserId },
        include: { user: true },
        orderBy: { date: 'desc' },
      });
    }),

  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendance.findFirst({
      where: { 
        userId: ctx.session.user.id, 
        date: { gte: today },
        clockOut: null
      }
    });
  }),

  clockIn: protectedProcedure
    .input(z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already clocked in today
      const existing = await prisma.attendance.findFirst({
        where: { userId: ctx.session.user.id, date: { gte: today } }
      });

      if (existing) {
        throw new Error("Already clocked in today");
      }

      const now = new Date();
      const status = now.getHours() >= 10 ? 'Late' : 'Present';

      // --- Evaluate Automation Rules (No-Code HR Workflow Engine) ---
      const activeRules = await prisma.automationRule.findMany({
        where: { isActive: true, triggerEvent: 'absence', tenantId: ctx.session.user.tenantId }
      });
      for (const rule of activeRules) {
        if (rule.condition.includes('> 3')) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const absences = await prisma.attendance.count({
            where: { userId: ctx.session.user.id, status: 'Absent', date: { gte: thirtyDaysAgo } }
          });
          
          if (absences > 3) {
            if (rule.action === 'send_warning') {
              await prisma.notification.create({
                data: { 
                  userId: ctx.session.user.id, 
                  type: 'System', 
                  message: `AUTOMATION: Rule "${rule.name}" triggered. Warning for excessive absence.` 
                }
              });
            }
          }
        }
      }

      // --- Shift Overtime Auto-Capper ---
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const weeklyLogs = await prisma.attendance.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: startOfWeek }
        }
      });
      
      let totalMs = 0;
      for (const log of weeklyLogs) {
        if (log.clockIn && log.clockOut) {
          totalMs += log.clockOut.getTime() - log.clockIn.getTime();
        }
      }
      
      const totalHours = totalMs / (1000 * 60 * 60);
      if (totalHours >= 39.5) {
        throw new Error("OVERTIME LIMIT REACHED: You have logged 39.5+ hours this week. Clock-in blocked without Executive Override.");
      }

      // Advanced Anomaly Detection (Mock Geofence)
      let anomaly = null;
      if (input.latitude && input.longitude) {
        const hqLat = 23.8103;
        const hqLon = 90.4125;
        // Simple distance calculation
        const dist = Math.sqrt(Math.pow(input.latitude - hqLat, 2) + Math.pow(input.longitude - hqLon, 2));
        if (dist > 0.1) anomaly = 'Geofence Violation - Remote Location';
      } else {
        anomaly = 'Geolocation Disabled';
      }

      return prisma.attendance.create({
        data: {
          userId: ctx.session.user.id,
          date: new Date(),
          clockIn: now,
          status,
          anomaly,
          shift: 'Morning (09:00-17:00)',
          lat: input.latitude,
          lng: input.longitude
        }
      });
    }),

  clockOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const active = await prisma.attendance.findFirst({
        where: { userId: ctx.session.user.id, date: { gte: today }, clockOut: null }
      });

      if (!active) throw new Error("No active clock-in found");

      return prisma.attendance.update({
        where: { id: active.id },
        data: { clockOut: new Date() }
      });
    })
});
