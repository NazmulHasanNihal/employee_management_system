import { getEmployeesScoped, getActivePresenceScoped } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import PresenceGrid from '@/components/grid/PresenceGrid';

export const dynamic = 'force-dynamic';

export default async function GridPage() {
  const caller = await getCaller();
  const [employees, active] = await Promise.all([
    getEmployeesScoped(caller),
    getActivePresenceScoped(caller),
  ]);

  return (
    <PresenceGrid
      employees={(employees as any[]).map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        department: e.department,
        designation: e.designation,
      }))}
      active={(active as any[]).map((a) => ({ id: a.id }))}
    />
  );
}
