import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import AutomationsClientPage from './AutomationsClientPage';
import { Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AutomationsPage() {
  // Server-side enforcement: non-admins are redirected before any data loads.
  await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Workflow Automations"
        subtitle="Configure triggers, actions, and scheduled jobs."
        icon={<Zap className="h-5 w-5" />}
      />
      <AutomationsClientPage />
    </div>
  );
}
