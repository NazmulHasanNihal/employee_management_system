'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface SinglePaymentInput {
  userId: string;
  paymentType?: string;
  paymentMethod?: string;
  bankName?: string;
  accountNumber?: string;
  branchName?: string;
  routingNumber?: string;
  baseAmount: number;
  bonuses?: number;
  adjustments?: number;
  deductions?: number;
  remarks?: string;
}

export interface BulkPaymentInput {
  employeeIds: string[];
  paymentMonth: string;
  paymentMethod?: string;
  bonusPercentage?: number;
  taxDeductionPercentage?: number;
  remarks?: string;
}

export interface PaymentAdjustmentInput {
  userId: string;
  type: 'INCREASE' | 'DECREASE';
  amount: number;
  reason: string;
  effectiveDate?: string;
}

async function getCallerId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true, role: true, isOwner: true },
    });
    return dbUser?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Execute a Single Real-Life Payment Disbursement
 */
export async function executeSinglePaymentRecord(input: SinglePaymentInput) {
  try {
    const callerId = await getCallerId();
    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, name: true, email: true, designation: true, department: true },
    });

    if (!targetUser) {
      throw new Error('Target employee not found.');
    }

    const baseAmount = Number(input.baseAmount) || 0;
    const bonuses = Number(input.bonuses) || 0;
    const adjustments = Number(input.adjustments) || 0;
    const deductions = Number(input.deductions) || 0;
    const netPaidAmount = Math.max(0, baseAmount + bonuses + adjustments - deductions);

    const randomRef = Math.floor(100000 + Math.random() * 900000);
    const trxId = `TRX-2026-BD-${randomRef}`;

    const record = await prisma.paymentRecord.create({
      data: {
        trxId,
        userId: input.userId,
        disbursedById: callerId,
        paymentType: input.paymentType || 'SALARY',
        paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
        batchType: 'SINGLE',
        bankName: input.bankName || 'City Bank PLC',
        accountNumber: input.accountNumber || '110-294810-001',
        branchName: input.branchName || 'Gulshan Corporate Branch',
        routingNumber: input.routingNumber || '085260124',
        baseAmount,
        bonuses,
        adjustments,
        deductions,
        netPaidAmount,
        remarks: input.remarks || `Single Disbursement for ${targetUser.name}`,
        status: 'DISBURSED',
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'Payment',
        message: `Payment of ৳${netPaidAmount.toLocaleString('en-IN')} (${input.paymentType || 'Salary'}) has been disbursed to your account (${input.paymentMethod || 'Bank Transfer'}). TrxID: ${trxId}`,
        link: `/payroll`,
        read: false,
      },
    });

    revalidatePath('/payroll');
    revalidatePath('/compensation');
    return { success: true, record };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to execute payment disbursement.' };
  }
}

/**
 * Execute a Bulk Corporate Payment Batch (Monthly Payroll Dispatch)
 */
export async function executeBulkPaymentBatch(input: BulkPaymentInput) {
  try {
    const callerId = await getCallerId();
    let targetEmployees = [];

    if (!input.employeeIds || input.employeeIds.length === 0) {
      targetEmployees = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, baseSalary: true, designation: true, department: true },
      });
    } else {
      targetEmployees = await prisma.user.findMany({
        where: { id: { in: input.employeeIds } },
        select: { id: true, name: true, baseSalary: true, designation: true, department: true },
      });
    }

    if (targetEmployees.length === 0) {
      throw new Error('No target active employees found for bulk disbursement.');
    }

    const batchRef = `BATCH-2026-${Date.now().toString().slice(-6)}`;
    const bonusPct = Number(input.bonusPercentage) || 0;
    const taxPct = Number(input.taxDeductionPercentage) || 5;

    let totalDisbursed = 0;
    const paymentRecordsData = [];
    const notificationsData = [];

    for (const emp of targetEmployees) {
      const base = emp.baseSalary && emp.baseSalary > 0 ? emp.baseSalary : 35000;
      const bonuses = Math.round(base * (bonusPct / 100));
      const deductions = Math.round(base * (taxPct / 100));
      const netPaidAmount = Math.max(0, base + bonuses - deductions);
      totalDisbursed += netPaidAmount;

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const trxId = `TRX-BULK-${randomSuffix}`;

      paymentRecordsData.push({
        trxId,
        userId: emp.id,
        disbursedById: callerId,
        paymentType: 'SALARY',
        paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
        batchType: 'BULK_BATCH',
        batchRef,
        bankName: 'Brac Bank PLC',
        accountNumber: '1501-2094-811',
        branchName: 'Dhaka Main Branch',
        routingNumber: '060261729',
        baseAmount: base,
        bonuses,
        adjustments: 0,
        deductions,
        netPaidAmount,
        remarks: input.remarks || `Corporate Payroll Disbursement (${input.paymentMonth || 'August 2026'})`,
        status: 'DISBURSED',
      });

      notificationsData.push({
        userId: emp.id,
        type: 'Payment',
        message: `Monthly Payroll Payment of ৳${netPaidAmount.toLocaleString('en-IN')} for ${input.paymentMonth || 'August 2026'} has been disbursed. TrxID: ${trxId} [Batch: ${batchRef}]`,
        link: `/payroll`,
        read: false,
      });
    }

    await prisma.$transaction([
      prisma.paymentRecord.createMany({ data: paymentRecordsData }),
      prisma.notification.createMany({ data: notificationsData }),
    ]);

    revalidatePath('/payroll');
    revalidatePath('/compensation');
    return {
      success: true,
      count: targetEmployees.length,
      totalDisbursed,
      batchRef,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to execute bulk payment batch.' };
  }
}

/**
 * Record a Payment Increase (+) or Decrease (-) with Live Base Salary Update & Audit Trail
 */
export async function createPaymentAdjustmentRecord(input: PaymentAdjustmentInput) {
  try {
    const callerId = await getCallerId();
    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, name: true, baseSalary: true },
    });

    if (!targetUser) {
      throw new Error('Target employee not found.');
    }

    const oldSalary = targetUser.baseSalary || 30000;
    const changeAmount = Math.abs(Number(input.amount) || 0);
    const isIncrease = input.type === 'INCREASE';
    
    const delta = isIncrease ? changeAmount : -changeAmount;
    const newSalary = Math.max(0, oldSalary + delta);
    const percentage = oldSalary > 0 ? (delta / oldSalary) * 100 : 0;

    // Record Compensation Adjustment
    const compAdj = await prisma.compensationAdjustment.create({
      data: {
        userId: input.userId,
        type: isIncrease ? 'INCREMENT' : 'DECREMENT',
        oldSalary,
        newSalary,
        delta,
        percentage,
        reason: input.reason || (isIncrease ? 'Salary Increase / Performance Raise' : 'Salary Decrease / Penalty Deduction'),
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : new Date(),
        notes: `Executed live salary adjustment of ৳${delta > 0 ? '+' : ''}${delta.toLocaleString('en-IN')}`,
        status: 'IMPLEMENTED',
        requestedById: callerId,
        approvedById: callerId,
        approvedAt: new Date(),
      },
    });

    // Update target user base salary
    await prisma.user.update({
      where: { id: input.userId },
      data: { baseSalary: newSalary },
    });

    // Log a corresponding Audit Payment Record
    const trxId = `TRX-ADJ-${Math.floor(100000 + Math.random() * 900000)}`;
    await prisma.paymentRecord.create({
      data: {
        trxId,
        userId: input.userId,
        disbursedById: callerId,
        paymentType: 'ADJUSTMENT',
        paymentMethod: 'SYSTEM_ADJUSTMENT',
        batchType: 'SINGLE',
        bankName: 'System Payroll Ledger',
        accountNumber: 'N/A',
        baseAmount: oldSalary,
        bonuses: isIncrease ? changeAmount : 0,
        adjustments: delta,
        deductions: !isIncrease ? changeAmount : 0,
        netPaidAmount: newSalary,
        remarks: `Salary ${isIncrease ? 'Increase' : 'Decrease'} Adjustment: ${input.reason}`,
        status: 'SETTLED',
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'Compensation',
        message: `Your base salary has been ${isIncrease ? 'increased' : 'adjusted'} by ৳${changeAmount.toLocaleString('en-IN')}. New Base Salary: ৳${newSalary.toLocaleString('en-IN')}. Reason: ${input.reason}`,
        link: `/compensation`,
        read: false,
      },
    });

    revalidatePath('/payroll');
    revalidatePath('/compensation');
    return { success: true, newSalary, compAdj };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to process payment adjustment.' };
  }
}

/**
 * Fetch Payment Records for Real-Life Bank Ledger View
 */
export async function getPaymentRecordsLedger() {
  try {
    const records = await prisma.paymentRecord.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, designation: true, department: true, avatarUrl: true, baseSalary: true },
        },
        disbursedBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { disbursedAt: 'desc' },
      take: 100,
    });

    return { success: true, records };
  } catch (error: any) {
    return { success: false, records: [], error: error?.message };
  }
}
