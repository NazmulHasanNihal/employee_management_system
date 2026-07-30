import React from 'react';
import { getApplications } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import ApplicationsClientPage from '@/components/applications/ApplicationsClientPage';
import { PageHeader } from '@/components/PageHeader';
import { Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const apps = await getApplications();

  // Server-fetched data fed to the client subcomponent. The client island now
  // reads the authenticated user from UserProvider (useUser) instead of
  // authClient.useSession.
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <ApplicationsClientPage initialApps={apps} isAdmin={isAdmin} />
    </div>
  );

}
