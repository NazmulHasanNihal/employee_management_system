import React from 'react';
import { getAuditLogs } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AuditClientPage from '@/components/audit/AuditClientPage';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const caller = await getCaller();
  if (!caller || (!caller.isAdmin && !caller.isCEO)) {
    redirect('/');
  }

  const events = await getAuditLogs();

  return <AuditClientPage initialEvents={events} />;
}
