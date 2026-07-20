import { Building2, ShieldAlert } from 'lucide-react';
import { getCaller, canViewOrg } from '@/lib/auth';
import { getEmployeesScoped, getDepartments } from '@/server/queries';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import HierarchyManager from '@/components/hierarchy/HierarchyManager';
import { getServerT } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export default async function HierarchyPage() {
  const caller = await getCaller();
  const isAdmin = caller ? canViewOrg(caller) : false;
  const t = await getServerT();

  const [employees, departments] = await Promise.all([
    getEmployeesScoped(caller),
    getDepartments(),
  ]);

  const employeeList = (employees as any[]).map((e) => ({ id: e.id, name: e.name }));
  const deptList = departments.map((d) => ({
    id: d.id,
    name: d.name,
    budget: (d as any).budget,
    head: (d as any).head,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title={t('Restructure Sandbox')}
        subtitle={t('Configure operational units, budgets, and leadership.')}
        icon={<Building2 className="h-5 w-5" />}
      />

      {!isAdmin ? (
        <EmptyState
          title={t('Restricted Zone')}
          description="Restructure operations require Admin clearance."
          icon={<ShieldAlert className="h-6 w-6" />}
        />
      ) : (
        <HierarchyManager departments={deptList as any} employees={employeeList} />
      )}
    </div>
  );
}
