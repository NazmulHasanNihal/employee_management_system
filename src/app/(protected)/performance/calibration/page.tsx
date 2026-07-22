import React from 'react';
import { SlidersHorizontal, ShieldAlert } from 'lucide-react';
import { q } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function CalibrationPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();

  const sessions = await q.calibrationSessions();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Access Denied"
          description="Performance calibration requires HR or admin authorization."
          icon={<ShieldAlert size={24} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<SlidersHorizontal className="h-5 w-5" />}
        title={t('Performance Calibration')}
        subtitle={t('Normalize review scores across the organization per calibration cycle.')}
      />
      <CalibrationIsland initialSessions={sessions} />
    </div>
  );
}

import CalibrationIsland from './CalibrationIsland';
