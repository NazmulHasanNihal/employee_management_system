import { requireAdmin } from '@/lib/auth';
import SettingsClientPage from './SettingsClientPage';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Server-side enforcement: system configuration is admin-only.
  await requireAdmin();
  return <SettingsClientPage />;
}
