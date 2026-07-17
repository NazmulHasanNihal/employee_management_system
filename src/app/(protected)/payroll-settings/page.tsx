import React from 'react';
import { Settings, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getSalaryHeads, getSalaryStructures } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { PayrollSettingsClient } from '@/components/payroll/PayrollSettingsClient';

export const dynamic = 'force-dynamic';

export default async function PayrollSettingsPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-[var(--rose)]/60" />
        <h2 className="text-xl font-semibold text-[var(--text-main)]">Access Denied</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Compensation engines require admin clearance.
        </p>
      </div>
    );
  }

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
