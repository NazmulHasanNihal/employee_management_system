import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { q } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function WhistleblowerPage() {
  await requireAdmin();
  const t = await getServerT();

  const [reports, members] = await Promise.all([
    q.whistleblowerReports(),
    q.committeeMembers(),
  ]);

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
