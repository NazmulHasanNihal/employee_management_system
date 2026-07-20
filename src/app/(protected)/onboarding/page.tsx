import { requireAdmin } from '@/lib/auth';
import OnboardingClientPage from './OnboardingClientPage';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  // Server-side enforcement: workflow/automation management is admin-only.
  await requireAdmin();
  return <OnboardingClientPage />;
}
