import { getEmployees, getActivePresence } from '@/server/queries';
import PresenceGrid from '@/components/grid/PresenceGrid';

export default async function GridPage() {
  const [employees, active] = await Promise.all([getEmployees(), getActivePresence()]);

  return (
    <PresenceGrid
      employees={employees.map((e) => ({
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
