import React from 'react';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getSalaryHeads, getSalaryStructures } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { PayrollSettingsClient } from '@/components/payroll/PayrollSettingsClient';

export const dynamic = 'force-dynamic';

export default async function PayrollSettingsPage() {
  await requireAdmin();

  const [heads, structures] = await Promise.all([getSalaryHeads(), getSalaryStructures()]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Compensation Engine"
        subtitle="Configure global salary structures & variables."
        icon={<Settings className="h-5 w-5" />}
      />
      <PayrollSettingsClient heads={heads} structures={structures} />
    </div>
  );
}
