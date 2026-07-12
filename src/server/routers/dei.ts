import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const deiRouter = router({
  getBiasAudit: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user as any;
    if (user.role !== 'Admin' && user.role !== 'HR Manager') {
      throw new Error('Unauthorized');
    }

    const users = await prisma.user.findMany({
      include: {
        payrolls: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    const groups: Record<string, { count: number, totalSalary: number }> = {};
    let globalAvgSalary = 0;
    let globalSalaryCount = 0;

    users.forEach(u => {
      // Grouping by department for the bias check
      const groupKey = u.department || 'Unassigned';
      if (!groups[groupKey]) groups[groupKey] = { count: 0, totalSalary: 0 };
      
      groups[groupKey].count += 1;

      if (u.payrolls.length > 0) {
        groups[groupKey].totalSalary += u.payrolls[0].baseSalary;
        globalAvgSalary += u.payrolls[0].baseSalary;
        globalSalaryCount += 1;
      }
    });

    const overallAvgSalary = globalSalaryCount > 0 ? globalAvgSalary / globalSalaryCount : 0;

    const analysis = Object.entries(groups).map(([name, data]) => {
      const avgSalary = data.count > 0 ? data.totalSalary / data.count : 0;

      // Detect potential bias:
      let biasFlag = false;
      let reason = '';
      if (avgSalary < overallAvgSalary * 0.7 && overallAvgSalary > 0) {
        biasFlag = true;
        reason = 'Systematically underpaid compared to global average.';
      } else if (avgSalary > overallAvgSalary * 1.5 && overallAvgSalary > 0) {
        biasFlag = true;
        reason = 'Systematically overpaid compared to global average.';
      }

      return {
        group: name,
        headcount: data.count,
        avgSalary,
        avgOkr: 0,
        biasFlag,
        reason
      };
    });

    return {
      overallAvgSalary,
      analysis
    };
  })
});
