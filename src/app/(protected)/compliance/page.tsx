import React from 'react';
import { ShieldAlert, Award, AlertTriangle, EyeOff, ShieldCheck, CheckCircle } from 'lucide-react';
import { q } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { getServerT } from '@/lib/i18n-server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import ComplianceIsland from './ComplianceIsland';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const t = await getServerT();

  const [myCerts, expiringCerts, whistleblowerReports] = await Promise.all([
    q.myCertifications(),
    isAdmin ? q.expiringCertifications() : Promise.resolve([]),
    isAdmin ? q.whistleblowerReports() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<ShieldAlert className="h-5 w-5" />}
        title={t('Governance')}
        subtitle={t('Compliance Tracking & Integrity Reporting.')}
      />

      <ComplianceIsland
        isAdmin={isAdmin}
        initialMyCerts={myCerts}
        initialExpiringCerts={expiringCerts}
        initialWhistleblower={whistleblowerReports}
      />
    </div>
  );
}
