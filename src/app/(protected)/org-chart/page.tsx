import { Network } from 'lucide-react';
import { getOrgTree } from '@/server/queries';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import OrgChartLazy from '@/components/org-chart/OrgChartLazy';

export default async function OrgChartPage() {
  const tree = (await getOrgTree()) as any;

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
