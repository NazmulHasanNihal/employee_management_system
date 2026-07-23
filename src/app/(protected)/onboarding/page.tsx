import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import OnboardingClientPage from './OnboardingClientPage';
import { UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  // Server-side enforcement: workflow/automation management is admin-only.
  await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Onboarding Workflow"
        subtitle="New hire sequences and checklist management."
        icon={<UserPlus className="h-5 w-5" />}
      />
      <OnboardingClientPage />
    </div>
  );
}
