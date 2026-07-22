import React from 'react';
import { GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getTrainingCatalog, getComplianceTraining } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { TrainingClient } from '@/components/training/TrainingClient';

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const [catalog, compliance] = await Promise.all([
    getTrainingCatalog(caller),
    getComplianceTraining(caller),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Training & Learning"
        subtitle="Course catalog, enrollments, and compliance training tracking."
        icon={<GraduationCap className="h-5 w-5" />}
      />
      <TrainingClient catalog={catalog} compliance={compliance} isAdmin={isAdmin} />
    </div>
  );
}
