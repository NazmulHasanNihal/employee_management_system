import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const shiftsRouter = router({
  getShifts: protectedProcedure.query(async ({ ctx }: any) => {
    return ctx.prisma.shift.findMany({
      orderBy: { startTime: 'asc' }
    });
  }),
  getAssignments: protectedProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ ctx, input }: any) => {
      const where: any = {};
      if (input.date) {
        const start = new Date(input.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(input.date);
        end.setHours(23, 59, 59, 999);
        where.date = { gte: start, lte: end };
      }
      return ctx.prisma.shiftAssignment.findMany({
        where,
        include: { shift: true, user: { select: { name: true, department: true } } },
        orderBy: { date: 'asc' }
      });
    }),
  assignShift: protectedProcedure
    .input(z.object({ userId: z.string(), shiftId: z.string(), date: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      return ctx.prisma.shiftAssignment.create({
        data: {
          userId: input.userId,
          shiftId: input.shiftId,
          date: new Date(input.date),
        }
      });
    }),
  createShift: protectedProcedure
    .input(z.object({ name: z.string(), startTime: z.string(), endTime: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      return ctx.prisma.shift.create({
        data: {
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
        }
      });
    }),
  removeAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      return ctx.prisma.shiftAssignment.delete({
        where: { id: input.assignmentId }
      });
    }),
  autoGenerateRoster: protectedProcedure
    .input(z.object({ startDate: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      // Simulate an AI mathematically distributing shifts
      const start = new Date(input.startDate);
      const users = await ctx.prisma.user.findMany({ take: 20 }); // Limit to 20 for simulation
      const shifts = await ctx.prisma.shift.findMany();
      
      if (shifts.length === 0 || users.length === 0) throw new Error('No shifts or users found.');

      // Clear upcoming week to regenerate
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      await ctx.prisma.shiftAssignment.deleteMany({
        where: { date: { gte: start, lte: end } }
      });

      const assignments = [];
      // Assign shifts pseudo-randomly to balance load
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);

        // Assign 2 shifts per day for demonstration
        for(let s = 0; s < 2; s++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
            
            assignments.push({
                userId: randomUser.id,
                shiftId: randomShift.id,
                date: currentDate,
            });
        }
      }

      await ctx.prisma.shiftAssignment.createMany({
        data: assignments
      });

      return { success: true, count: assignments.length };
    }),
});
