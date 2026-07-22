import { Network, ShieldAlert } from 'lucide-react';
import { getOrgTree } from '@/server/queries';
import { getCaller, canViewOrg } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import OrgChartLazy from '@/components/org-chart/OrgChartLazy';

export const dynamic = 'force-dynamic';

export default async function OrgChartPage() {
  const caller = await getCaller();

  // The full organizational hierarchy is restricted to admins, HR, the CEO/owner
  // and managers. Regular employees do not get the org-wide tree.
  if (!canViewOrg(caller)) {
    return (
      <div className="flex h-full flex-col space-y-6">
        <PageHeader
          title="Org Chart"
          subtitle="Dynamic hierarchical visualization of the organization."
          icon={<Network className="h-5 w-5" />}
        />
        <EmptyState
          title="Restricted"
          description="The organizational chart is available to managers and administrators."
          icon={<ShieldAlert size={24} />}
        />
      </div>
    );
  }

  const tree = await getOrgTree();

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title="Org Chart"
        subtitle="Dynamic hierarchical visualization of the organization."
        icon={<Network className="h-5 w-5" />}
      />

      {tree && tree.id ? (
        <OrgChartLazy tree={tree} />
      ) : (
        <EmptyState title="No org data found" description="Add managers and reporting lines to build the chart." />
      )}
    </div>
  );
}
