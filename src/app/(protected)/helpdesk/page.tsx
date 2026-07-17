import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getTickets } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { HelpdeskClient } from '@/components/helpdesk/HelpdeskClient';

export const dynamic = 'force-dynamic';

export default async function HelpdeskPage() {
  const caller = await getCaller();
  const userId = caller?.id ?? '';
  const isPrivileged = caller?.isAdmin || caller?.isCEO || false;
  const tickets = await getTickets(caller);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Support Center"
        subtitle="Submit IT/HR inquiries and track resolution status."
        icon={<LifeBuoy className="h-5 w-5" />}
      />
      <HelpdeskClient initialTickets={tickets} userId={userId} isPrivileged={isPrivileged} />
    </div>
  );
}
