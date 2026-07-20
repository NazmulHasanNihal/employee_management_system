import { requireAdmin } from '@/lib/auth';
import AutomationsClientPage from './AutomationsClientPage';

export const dynamic = 'force-dynamic';

export default async function AutomationsPage() {
  // Server-side enforcement: non-admins are redirected before any data loads.
  await requireAdmin();
  return <AutomationsClientPage />;
}
