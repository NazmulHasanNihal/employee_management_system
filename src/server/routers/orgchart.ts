import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const orgchartRouter = router({
  getOrgData: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user as any;
    if (user.role !== 'Admin' && user.role !== 'HR Manager') {
      throw new Error('Unauthorized');
    }

    const departments = await prisma.department.findMany();
    const users = await prisma.user.findMany({
      include: {
        payrolls: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    return {
      departments,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        department: u.department || 'Unassigned',
        salary: u.payrolls.length > 0 ? u.payrolls[0].baseSalary : 0,
        image: u.image
      }))
    };
  })
});
