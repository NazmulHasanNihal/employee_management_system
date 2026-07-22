import { ShieldAlert } from 'lucide-react';
import { q } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import WhistleblowerIsland from './WhistleblowerIsland';

export const dynamic = 'force-dynamic';

export default async function WhistleblowerPage() {
  await requireAdmin();

  const [reports, members] = await Promise.all([
    q.whistleblowerReports(),
    q.committeeMembers(),
  ]);

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Whistleblower Committee"
        subtitle="Triage confidential reports and manage the ethics committee roster."
      />
      <WhistleblowerIsland initialReports={reports} initialMembers={members} />
    </div>
  );
}
