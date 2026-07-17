import { Users } from 'lucide-react';
import { getEmployees } from '@/server/queries';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/PageHeader';
import RegistryExplorer from '@/components/registry/RegistryExplorer';

export default async function RegistryPage() {
  const [employees, branches] = await Promise.all([
    getEmployees() as unknown as any[],
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Master Registry"
        subtitle="Centralized employee database and access control."
        icon={<Users className="h-5 w-5" />}
      />
      <RegistryExplorer employees={employees} branches={branches} />
    </div>
  );
}
