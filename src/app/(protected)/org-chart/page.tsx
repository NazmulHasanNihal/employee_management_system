import { Network } from 'lucide-react';
import { getOrgTree } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import OrgChartLazy from '@/components/org-chart/OrgChartLazy';

export const dynamic = 'force-dynamic';

export default async function OrgChartPage() {
  const caller = await getCaller();

  const [tree, employees] = await Promise.all([
    getOrgTree(),
    prisma.user.findMany({
      where: { status: { not: 'Terminated' } },
      select: { id: true, name: true, role: true, designation: true, department: true, managerId: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Edit / management selection options are restricted ONLY to Admin, HR, and CEO
  const canAssignManager = caller ? (caller.isAdmin || caller.isCEO || caller.isHR) : false;

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title="Org Chart"
        subtitle="Dynamic hierarchical visualization of the organization."
        icon={<Network className="h-5 w-5" />}
      />

      {tree && tree.id ? (
        <OrgChartLazy tree={tree} employees={employees} canAssignManager={canAssignManager} />
      ) : (
        <EmptyState title="No org data found" description="Add managers and reporting lines to build the chart." />
      )}
    </div>
  );
}
