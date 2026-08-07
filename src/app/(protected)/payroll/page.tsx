import React from 'react';
import { DollarSign, History, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { PayrollActions } from '@/components/payroll/PayrollActions';
import { PayslipCard } from '@/components/payroll/PayslipCard';
import { PaymentHub } from '@/components/payroll/PaymentHub';
import PaymentSystemHub from '@/components/payroll/PaymentSystemHub';
import { getPayrolls, getPayrollAdminStats, getPaymentsForUser, getSalesMonthTotal, type PayrollWithUser } from '@/server/queries';
import { getPaymentRecordsLedger, purgeDummyPaymentRecords } from '@/app/actions/payments';
import { prisma } from '@/lib/prisma';
import { getCaller } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { getServerT } from '@/lib/i18n-server';
import { T } from "@/components/Translate";

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  // Permanently purge any dummy 100,000,000 BDT test payment records from DB
  await purgeDummyPaymentRecords();

  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const isPrivileged = isAdmin || caller?.isCEO || caller?.isHR;
  const t = await getServerT();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastMonthYear = month === 1 ? year - 1 : year;

  const [payrolls, adminStats, payments, salesThis, salesLast, ledgerRes, employees] = await Promise.all([
    getPayrolls(caller),
    getPayrollAdminStats(caller),
    getPaymentsForUser(caller),
    getSalesMonthTotal(caller?.id || '', month, year),
    getSalesMonthTotal(caller?.id || '', lastMonth, lastMonthYear),
    getPaymentRecordsLedger(),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true, designation: true, department: true, baseSalary: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const latestPayslip = payrolls[0] || null;
  const paymentRecords = (ledgerRes.records || []) as any;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('Payroll & Payment Simulation System')}
        subtitle={t('Real-life bank disbursement ledger, single & bulk payments, and compensation adjustments.')}
        icon={<DollarSign className="h-5 w-5" />}
        actions={isAdmin ? <PayrollActions payrolls={payrolls} /> : undefined}
      />

      {/* ── REAL-LIFE PAYMENT SYSTEM SIMULATION HUB ── */}
      <PaymentSystemHub
        records={paymentRecords}
        employees={employees}
        canDisburse={isPrivileged}
      />

      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {t('Total Payroll YTD')}
              </p>
              <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">
                {formatCurrency(adminStats.totalYTD, 'BDT', 'en')}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{t('Across')} {adminStats.employeeCount} {t('employees')}</span>
                <DeltaBadge value={adminStats.momDeltaPct} label="run cost MoM" goodWhen="up" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Monthly Run-Rate</T></p>
              <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">
                {formatCurrency(adminStats.monthlyRunRate, 'BDT', 'en')}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Avg</T>{formatCurrency(adminStats.avgPerEmployee, 'BDT', 'en')} {/* @ts-ignore */}<T>/ employee</T></p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {t('Last Run')}
              </p>
              <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">
                {adminStats.lastRunMonth}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--emerald)]">
                {adminStats.lastRunStatus === 'PROCESSED' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> {/* @ts-ignore */}<T>Processed</T></>
                ) : (
                  adminStats.lastRunStatus
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>Payslips On File</T></p>
                <p className="mt-1 text-3xl font-semibold text-[var(--text-main)]">
                  {payrolls.length}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {adminStats.processedPct}{/* @ts-ignore */}<T>% runs processed</T></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PaymentHub
        isAdmin={isAdmin}
        latestPayslip={latestPayslip}
        salesThisMonth={salesThis}
        salesLastMonth={salesLast}
        payments={payments}
        month={month}
        year={year}
        userId={caller?.id || ''}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {/* @ts-ignore */}<T>Payslip Vault</T></h2>

        {payrolls.length === 0 ? (
          <EmptyState
            title="No Payslips Found"
            description="There are no payslips in the vault yet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {payrolls.map((pay: PayrollWithUser) => (
              <PayslipCard key={pay.id} pay={pay} isAdmin={isAdmin} currentUser={caller} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
