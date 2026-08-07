import { PrismaClient } from '@prisma/client';

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function main() {
  const map: Record<string, any> = {
    User: prisma.user,
    Department: prisma.department,
    Branch: prisma.branch,
    Holiday: prisma.holiday,
    Shift: prisma.shift,
    Attendance: prisma.attendance,
    LeaveRequest: prisma.leaveRequest,
    Payroll: prisma.payroll,
    SalaryHead: prisma.salaryHead,
    Payment: prisma.payment,
    Penalty: prisma.penalty,
    Expense: prisma.expense,
    Asset: prisma.asset,
    Ticket: prisma.ticket,
    TeamTask: prisma.teamTask,
    CompanyNews: prisma.companyNews,
    CalendarEvent: prisma.calendarEvent,
    TrainingCourse: prisma.trainingCourse,
    DocumentTemplate: prisma.documentTemplate,
    Benefit: prisma.benefit,
    WhistleblowerReport: prisma.whistleblowerReport,
    Review: prisma.review,
    CompensationAdjustment: prisma.compensationAdjustment,
    FestivalBonus: prisma.festivalBonus,
  };

  console.log('--- DATABASE COUNT AUDIT ---');
  for (const [name, model] of Object.entries(map)) {
    try {
      const count = await model.count();
      console.log(`${name.padEnd(25)}: ${count}`);
    } catch (e: any) {
      console.log(`${name.padEnd(25)}: ERROR (${e.message})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
