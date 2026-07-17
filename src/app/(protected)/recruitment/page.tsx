import React from 'react';
import { Target, ShieldAlert, Briefcase } from 'lucide-react';
import { q } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import RecruitmentIsland from './RecruitmentIsland';

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <EmptyState
          title={t('Access Denied')}
          description={t('ATS Systems require HR Authorization Clearance.')}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>
    );
  }

  const jobs = await q.jobs();

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Target className="h-5 w-5" />}
        title={t('Applicant Tracking')}
        subtitle={t('Manage active job requisitions and candidate pipelines.')}
      />

      <RecruitmentIsland initialJobs={jobs} />
    </div>
  );
}
