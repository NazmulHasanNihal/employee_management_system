import React from 'react';
import { Scale } from 'lucide-react';
import { q } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import BiasScannerClient from './BiasScannerClient';

export const dynamic = 'force-dynamic';

export default async function DEIPage() {
  await requireAdmin();

  const audit = await q.biasAudit();
  const initialDimensions = audit?.dimensions || [];
  const globalAvg = audit?.overallAvgSalary || 0;

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Scale className="h-5 w-5" />}
        title="Equity & Bias Scanner"
        subtitle="Automated intelligence identifying systemic pay discrepancies."
      />

      <BiasScannerClient initialDimensions={initialDimensions} globalAvg={globalAvg} />
    </div>
  );
}
