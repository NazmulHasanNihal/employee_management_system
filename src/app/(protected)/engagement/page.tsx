import React from 'react';
import { Gift, Cake, CalendarHeart } from 'lucide-react';
import { q } from '@/server/queries';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';

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
        initialRules={data.rules as any[]}
        initialHistory={data.history as any[]}
        initialUpcoming={data.upcoming as any[]}
        canManage={data.canManage as boolean}
      />
    </div>
  );
}

import EngagementIsland from './EngagementIsland';
