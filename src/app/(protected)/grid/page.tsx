import { getEmployeesScoped, getActivePresenceScoped } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Users } from 'lucide-react';
import PresenceGrid from '@/components/grid/PresenceGrid';

export const dynamic = 'force-dynamic';

export default async function GridPage() {
  const caller = await getCaller();
  const [employees, active] = await Promise.all([
    getEmployeesScoped(caller),
    getActivePresenceScoped(caller),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Presence Grid"
        subtitle="Real-time workspace occupancy and availability tracker."
        icon={<Users className="h-5 w-5" />}
      />
      <PresenceGrid
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          role: e.role,
          department: e.department,
          designation: e.designation,
        }))}
        active={active.map((a) => ({ id: a.id }))}
      />
    </div>
  );
}
