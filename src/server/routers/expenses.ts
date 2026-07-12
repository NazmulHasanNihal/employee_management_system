import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const expensesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }: any) => {
    return ctx.prisma.expense.findMany({
      include: { user: { select: { name: true, department: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }),
  getMyExpenses: protectedProcedure.query(async ({ ctx }: any) => {
    return ctx.prisma.expense.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' }
    });
  }),
  submit: protectedProcedure
    .input(z.object({ 
      amount: z.number().optional(), 
      category: z.string(), 
      description: z.string(), 
      receiptUrl: z.string().optional(),
      isMileage: z.boolean().optional().default(false),
      distance: z.number().optional()
    }))
    .mutation(async ({ ctx, input }: any) => {
      let finalAmount = input.amount || 0;
      if (input.isMileage && input.distance) {
        finalAmount = input.distance * 0.65; // $0.65 per mile
      }

      let status = "PENDING";
      if (input.category === "MEALS" && finalAmount > 50) status = "PENDING_EXECUTIVE";
      if (input.category === "TRAVEL" && finalAmount > 200) status = "PENDING_EXECUTIVE";

      return ctx.prisma.expense.create({
        data: {
          userId: ctx.session.user.id,
          amount: finalAmount,
          category: input.category,
          description: input.description,
          receiptUrl: input.receiptUrl,
          isMileage: input.isMileage,
          distance: input.distance,
          status: status
        }
      });
    }),
  updateStatus: protectedProcedure
    .input(z.object({ expenseId: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.expenseId },
        include: { user: true }
      });
      if (!expense) throw new Error("Not found");

      let canApprove = ctx.session.user.role === 'Admin' || ctx.session.user.role === 'HR Manager';

      if (!canApprove && expense.status !== "PENDING_EXECUTIVE") {
        const managerId = expense.user.managerId;
        if (managerId === ctx.session.user.id) {
          canApprove = true;
        } else if (managerId) {
          const manager = await ctx.prisma.user.findUnique({ where: { id: managerId } });
          if (manager?.proxyId === ctx.session.user.id) {
            if (!manager.proxyValidUntil || manager.proxyValidUntil >= new Date()) {
              canApprove = true;
            }
          }
        }
      }

      if (!canApprove) {
        throw new Error("Unauthorized to approve this expense");
      }

      return ctx.prisma.expense.update({
        where: { id: input.expenseId },
        data: { status: input.status }
      });
    }),
});
