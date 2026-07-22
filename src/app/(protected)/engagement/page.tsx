import React from 'react';
import { Gift } from 'lucide-react';
import { q } from '@/server/queries';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';
import EngagementIsland from './EngagementIsland';

export const dynamic = 'force-dynamic';

export default async function EngagementPage() {
  const t = await getServerT();
  const data = await q.engagementGreetings();

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Gift className="h-5 w-5" />}
        title={t('Engagement')}
        subtitle={t('Celebrate team birthdays, work anniversaries, and festivals together.')}
      />
      <EngagementIsland
        initialRules={data.rules}
        initialHistory={data.history}
        initialUpcoming={data.upcoming}
        canManage={data.canManage}
      />
    </div>
  );
}
