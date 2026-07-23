import React from 'react';
import { DollarSign, History, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { PayrollActions } from '@/components/payroll/PayrollActions';
import { PayslipCard } from '@/components/payroll/PayslipCard';
import { PaymentHub } from '@/components/payroll/PaymentHub';
import { getPayrolls, getPayrollAdminStats, getPaymentsForUser, getSalesMonthTotal, type PayrollWithUser } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { getServerT } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const lastMonth = month === 1 ? 12 : month - 1;
  const lastMonthYear = month === 1 ? year - 1 : year;

  const [payrolls, adminStats, payments, salesThis, salesLast] = await Promise.all([
    getPayrolls(caller),
    getPayrollAdminStats(caller),
    getPaymentsForUser(caller),
    getSalesMonthTotal(caller?.id || '', month, year),
    getSalesMonthTotal(caller?.id || '', lastMonth, lastMonthYear),
  ]);

  const latestPayslip = payrolls[0] || null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('Payroll')}
        subtitle={t('Compensation, distributions & payslips.')}
        icon={<DollarSign className="h-5 w-5" />}
        actions={isAdmin ? <PayrollActions payrolls={payrolls} /> : undefined}
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
                Monthly Run-Rate
              </p>
               <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">
                {formatCurrency(adminStats.monthlyRunRate, 'BDT', 'en')}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Avg {formatCurrency(adminStats.avgPerEmployee, 'BDT', 'en')} / employee
              </p>
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
                    <CheckCircle2 className="h-3 w-3" /> Processed
                  </>
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
                  Payslips On File
                </p>
                <p className="mt-1 text-3xl font-semibold text-[var(--text-main)]">
                  {payrolls.length}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {adminStats.processedPct}% runs processed
                </p>
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
          Payslip Vault
        </h2>

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
