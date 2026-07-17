import React from 'react';
import { Receipt } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getExpenses } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { ExpensesClient } from '@/components/expenses/ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();
  const expenses = await getExpenses(caller);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('Expenses Hub')}
        subtitle={isAdmin ? t('Corporate reimbursement approvals.') : t('My expense & reimbursement claims.')}
        icon={<Receipt className="h-5 w-5" />}
      />
      <ExpensesClient initialExpenses={expenses} isAdmin={isAdmin} />
    </div>
  );
}
