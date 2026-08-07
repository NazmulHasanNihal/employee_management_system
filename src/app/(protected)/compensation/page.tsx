import React from 'react';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { getCompensationAdjustments } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { getServerT } from '@/lib/i18n-server';
import { CompensationAdjustments } from '@/components/compensation/CompensationAdjustments';

export const dynamic = 'force-dynamic';

export default async function CompensationPage() {
  const caller = await getCaller();
  const t = await getServerT();
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const isHR = caller?.isHR ?? false;
  const roleStr = (caller?.role || '').toUpperCase();
  const isManager = roleStr.includes('MANAGER') || roleStr.includes('DIRECTOR') || roleStr.includes('LEAD') || roleStr.includes('HEAD');
  const privileged = isAdmin || isCEO || isHR || isManager;

  let adjustments: any[] = [];
  try {
    const raw = await getCompensationAdjustments(caller);
    adjustments = Array.isArray(raw) ? raw : [];
  } catch (err) {
    console.error('Failed to load compensation adjustments:', err);
    adjustments = [];
  }

  const totalIncrements = adjustments.filter((a: { type: string }) => a?.type === 'INCREMENT').length;
  const totalDecrements = adjustments.filter((a: { type: string }) => a?.type === 'DECREMENT').length;
  const totalCostImpact = adjustments
    .filter((a: { status: string }) => a?.status === 'IMPLEMENTED')
    .reduce((sum: number, a: { delta?: number }) => sum + (Number(a?.delta) || 0), 0);

  // Edit options (new adjustment, bulk adjustment, edit/approve/reject) are restricted ONLY to Admin, HR, and CEO
  const canEditCompensation = isAdmin || isCEO || isHR;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('Compensation')}
        subtitle={t('Manage salary increments, decrements, and payroll adjustments.')}
        icon={<TrendingUp className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t('Total Adjustments')}
            </p>
            <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">{adjustments.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t('Increments')}
            </p>
            <p className="mt-2 text-fluid-3xl font-semibold text-[var(--emerald)]">+{totalIncrements}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t('Decrements')}
            </p>
            <p className="mt-2 text-fluid-3xl font-semibold text-[var(--rose)]">+{totalDecrements}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t('Implemented Cost Impact')}
            </p>
            <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">
              {totalCostImpact >= 0 ? '+' : ''}{formatCurrency(totalCostImpact, 'BDT', 'en')}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{t('Net change from implemented adjustments')}</p>
          </CardContent>
        </Card>
      </div>

      <CompensationAdjustments adjustments={adjustments} isAdmin={isAdmin || isCEO} canApprove={canEditCompensation} />
    </div>
  );
}
