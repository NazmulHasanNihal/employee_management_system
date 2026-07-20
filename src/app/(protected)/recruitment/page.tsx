import React from 'react';
import { Target, Briefcase } from 'lucide-react';
import { q } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';
import RecruitmentIsland from './RecruitmentIsland';

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage() {
  await requireAdmin();
  const t = await getServerT();

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
