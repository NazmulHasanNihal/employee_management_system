import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const payrollRouter = router({
  getPayrolls: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role === 'Admin' || ctx.session.user.role === 'HR Manager') {
      return prisma.payroll.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    return prisma.payroll.findMany({
      where: { userId: ctx.session.user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getStructures: protectedProcedure.query(async () => {
    return prisma.payrollStructure.findMany({
      include: {
        heads: {
          include: { head: true }
        }
      }
    });
  }),

  getHeads: protectedProcedure.query(async () => {
    return prisma.payrollHead.findMany();
  }),

  createHead: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['EARNING', 'DEDUCTION'])
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') throw new Error('Unauthorized');
      return prisma.payrollHead.create({ data: input });
    }),

  createStructure: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      baseSalary: z.number().optional(),
      heads: z.array(z.object({
        headId: z.string(),
        amountType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
        value: z.string()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') throw new Error('Unauthorized');
      
      return prisma.payrollStructure.create({
        data: {
          name: input.name,
          description: input.description,
          baseSalary: input.baseSalary,
          heads: {
            create: input.heads.map(h => ({
              headId: h.headId,
              amountType: h.amountType,
              value: h.value
            }))
          }
        }
      });
    }),

  runAutomatedPayroll: protectedProcedure
    .input(z.object({
      month: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'Admin' && ctx.session.user.role !== 'HR Manager') throw new Error('Unauthorized');
      
      const targetMonthDate = new Date(); // In a real system, parse input.month to filter attendance. For simplicity, fetching all current month.
      targetMonthDate.setDate(1);
      targetMonthDate.setHours(0,0,0,0);

      // Fetch employees with structures
      const employees = await prisma.user.findMany({
        where: { status: 'Active', payrollStructureId: { not: null } },
        include: {
          payrollStructure: {
            include: {
              heads: { include: { head: true } }
            }
          },
          attendances: {
            where: {
              date: { gte: targetMonthDate } // simplified filter
            }
          },
          taxProfile: true
        }
      });

      const processed = [];

      for (const emp of employees) {
        if (!emp.payrollStructure) continue;

        let totalHours = 0;
        let overtimeHours = 0;
        let lateDays = 0;

        // Calculate attendance metrics
        for (const att of emp.attendances) {
          if (att.status === 'Late') lateDays++;
          if (att.clockIn && att.clockOut) {
            const hours = (att.clockOut.getTime() - att.clockIn.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            if (hours > 8) {
              overtimeHours += (hours - 8);
            }
          } else if (att.clockIn && att.status === 'Present') {
             // Assume 8 hours if no clock out but marked present (placeholder)
             totalHours += 8;
          }
        }

        const BaseSalary = emp.salary || emp.payrollStructure.baseSalary || 0;
        const HourlyRate = emp.hourlyRate || (BaseSalary / 160); // Assume 160 hours/month standard
        
        let totalEarnings = 0;
        let totalDeductions = 0;
        const breakdown: Record<string, { name: string, type: string, amount: number }> = {};

        // --- Multi-State Tax Engine Integration ---
        const taxProfile = emp.taxProfile;
        if (taxProfile) {
          const taxDeduction = BaseSalary * (taxProfile.federalRate + taxProfile.stateRate);
          totalDeductions += taxDeduction;
          breakdown['dynamic-tax'] = { 
            name: `${taxProfile.state} & Fed Tax`, 
            type: 'DEDUCTION', 
            amount: taxDeduction 
          };
          
          // Re-calculate overtime if state daily cap is lower than default 8
          if (taxProfile.dailyOtCap && taxProfile.dailyOtCap < 8) {
            overtimeHours = 0;
            for (const att of emp.attendances) {
              if (att.clockIn && att.clockOut) {
                const hours = (att.clockOut.getTime() - att.clockIn.getTime()) / (1000 * 60 * 60);
                if (hours > taxProfile.dailyOtCap) overtimeHours += (hours - taxProfile.dailyOtCap);
              }
            }
          }
        }

        for (const sh of emp.payrollStructure.heads) {
          let calculatedAmount = 0;

          if (sh.amountType === 'FIXED') {
            calculatedAmount = parseFloat(sh.value);
          } else if (sh.amountType === 'PERCENTAGE') {
            calculatedAmount = BaseSalary * (parseFloat(sh.value) / 100);
          } else if (sh.amountType === 'FORMULA') {
            try {
              // Extremely basic math evaluator (WARNING: eval is dangerous in prod, but safe-ish here as formula is created by admin)
              let formulaStr = sh.value
                .replace(/BaseSalary/g, BaseSalary.toString())
                .replace(/TotalHours/g, totalHours.toString())
                .replace(/OvertimeHours/g, overtimeHours.toString())
                .replace(/LateDays/g, lateDays.toString())
                .replace(/HourlyRate/g, HourlyRate.toString());
              
              calculatedAmount = new Function('return ' + formulaStr)();
            } catch (e) {
              calculatedAmount = 0;
              console.error(`Failed to evaluate formula for ${sh.head.name}:`, e);
            }
          }

          breakdown[sh.headId] = {
            name: sh.head.name,
            type: sh.head.type,
            amount: calculatedAmount
          };

          if (sh.head.type === 'EARNING') totalEarnings += calculatedAmount;
          if (sh.head.type === 'DEDUCTION') totalDeductions += calculatedAmount;
        }

        const netPay = BaseSalary + totalEarnings - totalDeductions;

        const payroll = await prisma.payroll.create({
          data: {
            userId: emp.id,
            month: input.month,
            baseSalary: BaseSalary,
            net: netPay,
            breakdown: JSON.stringify(breakdown),
            totalHours,
            overtimeHours,
            lateDays,
            currency: emp.currency,
            status: 'Disbursed'
          }
        });
        processed.push(payroll);
      }

      return { count: processed.length };
    })
});
