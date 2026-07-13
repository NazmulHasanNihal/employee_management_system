'use server';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function executeServerQuery(path: string, args?: any) {
  try {
    if (path === 'registry.getAll') return await prisma.user.findMany({ include: { manager: true } });
    if (path === 'registry.searchEmployees') return await prisma.user.findMany();
    if (path === 'orgchart.getOrgData' || path === 'orgchart.getTree') {
      const users = await prisma.user.findMany();
      return { users };
    }
    if (path === 'team.getMyTeam') {
      const directReports = await prisma.user.findMany({ where: { managerId: args?.managerId || "cmri3jxi700041mmgjct8xyss" }});
      return { teamId: 'team_1', directReports };
    }
    if (path === 'dashboard.getStats') {
      const headcount = await prisma.user.count();
      const pendingApps = await prisma.leaveRequest.count({ where: { status: 'Pending' } });
      const totalPayrollResult = await prisma.payroll.aggregate({ _sum: { totalAmount: true } });
      return { headcount, pendingApps, activeToday: '95%', totalPayroll: totalPayrollResult._sum.totalAmount || 0 };
    }
    if (path === 'messages.getConversations') {
      return await prisma.user.findMany({ take: 15, select: { id: true, name: true, designation: true, avatarUrl: true, status: true } });
    }
    if (path === 'messages.getMessages') {
      return await prisma.message.findMany({ include: { sender: true, receiver: true }, orderBy: { createdAt: 'desc' } });
    }
    if (path === 'payroll.getPayrolls') {
      return await prisma.payroll.findMany({ include: { user: true } });
    }
    if (path === 'payroll.getHeads') return await prisma.salaryHead.findMany();
    if (path === 'expenses.getAll' || path === 'expenses.getMyExpenses') {
      return await prisma.expense.findMany({ include: { user: true } });
    }
    if (path === 'assets.getAssets') return await prisma.asset.findMany({ include: { user: true } });
    if (path === 'benefits.getEmployeeBenefits') return [];
    if (path === 'benefits.getEquityGrants') return [];
    if (path === 'benefits.getActiveEnrollmentPeriod') return { name: 'Annual Open Enrollment 2026', endDate: '2026-11-30T00:00:00.000Z' };
    if (path === 'recognition.getRecentKudos') return [];
    if (path === 'feedback.getAllFeedback') return [];
    if (path === 'documents.getDocuments') return [];
    if (path === 'applications.list') {
      return await prisma.leaveRequest.findMany({ include: { user: true } });
    }
    if (path === 'compliance.getExpiringCertifications') return [];
    if (path === 'compliance.getMyCertifications') return [];
    if (path === 'compliance.getWhistleblowerReports') return [];
    if (path === 'helpdesk.getTickets') {
      return await prisma.ticket.findMany({ include: { user: true } });
    }
    if (path === 'recruitment.getJobs') return [];
    if (path === 'departments.getDepartments') return await prisma.department.findMany();
    if (path === 'audit.getLogs') return await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } });
    
    // Default fallback
    return [];
  } catch (error: any) {
    console.error(`Error executing ${path}:`, error);
    throw new Error(error.message);
  }
}

export async function executeServerMutation(path: string, input: any) {
  try {
    if (path === 'registry.createEmployee') {
      return await prisma.user.create({ data: input });
    }
    if (path === 'registry.updateEmployee') {
      return await prisma.user.update({ where: { id: input.id }, data: input.data });
    }
    if (path === 'registry.deleteEmployee') {
      return await prisma.user.delete({ where: { id: input.id } });
    }
    if (path === 'payroll.createHead') {
      return await prisma.salaryHead.create({ data: input });
    }
    if (path === 'expenses.createExpense') {
      return await prisma.expense.create({ data: input });
    }
    // ... add others as needed
    return { success: true };
  } catch (error: any) {
    console.error(`Error executing mutation ${path}:`, error);
    throw new Error(error.message);
  }
}
