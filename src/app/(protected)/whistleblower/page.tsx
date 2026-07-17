import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { q } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function WhistleblowerPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();

  const [reports, members] = await Promise.all([
    isAdmin ? q.whistleblowerReports() : Promise.resolve([]),
    q.committeeMembers(),
  ]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Access Denied"
          description="The Whistleblower Committee workflow requires admin authorization."
          icon={<ShieldAlert size={24} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<ShieldAlert className="h-5 w-5" />}
        title={t('Whistleblower Committee')}
        subtitle={t('Triage confidential reports and manage the ethics committee roster.')}
      />
      <WhistleblowerIsland initialReports={reports as any[]} initialMembers={members as any[]} />
    </div>
  );
}

import WhistleblowerIsland from './WhistleblowerIsland';
