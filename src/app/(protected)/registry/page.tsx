import { Users } from 'lucide-react';
import { getEmployeesScoped } from '@/server/queries';
import { getCaller, canViewOrg } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import RegistryExplorer from '@/components/registry/RegistryExplorer';

export const dynamic = 'force-dynamic';

export default async function RegistryPage() {
  const caller = await getCaller();
  const [employees, branches] = await Promise.all([
    getEmployeesScoped(caller) as unknown as any[],
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Regular employees only ever see themselves + their direct reports, so we
  // surface a scoped badge instead of the full-org wording.
  const scoped = caller ? !canViewOrg(caller) : true;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Employee Directory"
        subtitle={scoped ? 'Your profile and direct reports.' : 'Centralized employee database and access control.'}
        icon={<Users className="h-5 w-5" />}
      />
      <RegistryExplorer employees={employees} branches={branches} />
    </div>
  );
}
