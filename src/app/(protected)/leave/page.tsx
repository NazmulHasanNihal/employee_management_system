import React from 'react';
import { Umbrella } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getLeaveRequests, getLeaveBalance, getLeaveTypes } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT, getLanguage } from '@/lib/i18n-server';
import { LeaveClient } from '@/components/leave/LeaveClient';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();
  const lang = await getLanguage();

  const [requests, balance, leaveTypes] = await Promise.all([
    getLeaveRequests(caller),
    getLeaveBalance(caller),
    getLeaveTypes(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('Leave Management')}
        subtitle={t('Bangladesh leave balances, accruals, and request tracking.')}
        icon={<Umbrella className="h-5 w-5" />}
      />
      <LeaveClient initialRequests={requests} initialBalance={balance} leaveTypes={leaveTypes as any} isAdmin={isAdmin} lang={lang} />
    </div>
  );
}
