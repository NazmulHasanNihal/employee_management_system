import React from 'react';
import { Ban } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getPenalties } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { PenaltiesClient } from '@/components/expenses/PenaltiesClient';

export const dynamic = 'force-dynamic';

export default async function PenaltiesPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();
  const penalties = await getPenalties(caller);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('My Penalties')}
        subtitle={t('Penalties issued against your account and payment status.')}
        icon={<Ban className="h-5 w-5" />}
      />
      <PenaltiesClient initialPenalties={penalties} isAdmin={isAdmin} />
    </div>
  );
}
