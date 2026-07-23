import React from 'react';
import { getAuditLogs } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Activity } from 'lucide-react';
import AuditClientPage from '@/components/audit/AuditClientPage';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const caller = await getCaller();
  if (!caller || (!caller.isAdmin && !caller.isCEO)) {
    redirect('/');
  }

  const events = await getAuditLogs();

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Audit Trail"
        subtitle="Immutable system activity log for compliance and security."
        icon={<Activity className="h-5 w-5" />}
      />
      <AuditClientPage initialEvents={events} />
    </div>
  );
}
