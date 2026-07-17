import React from 'react';
import { Receipt } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getExpenses, getPenalties } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { ExpensesClient } from '@/components/expenses/ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();
  const [expenses, penalties] = await Promise.all([
    getExpenses(caller),
    getPenalties(caller),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={isAdmin ? t('Expenses Hub') : t('My Penalties & Expenses')}
        subtitle={isAdmin ? t('Corporate reimbursement approvals.') : t('View your penalties and file expense claims.')}
        icon={<Receipt className="h-5 w-5" />}
      />
      <ExpensesClient initialExpenses={expenses} initialPenalties={penalties} isAdmin={isAdmin} />
    </div>
  );
}
