import { CalendarDays } from 'lucide-react';
import { getCaller } from '@/lib/auth';
import { getLanguage } from '@/lib/i18n-server';
import { getCalendarFeed, getMyTeam, getDepartments } from '@/server/queries';
import { PageHeader } from '@/components/PageHeader';
import CalendarView from '@/components/calendar/CalendarView';

export default async function CalendarPage() {
  const caller = await getCaller();
  const lang = await getLanguage();
  const [events, myTeam, departments] = await Promise.all([
    getCalendarFeed(caller, lang),
    getMyTeam(caller),
    getDepartments(),
  ]);

  const teamMembers = myTeam.directReports.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Company Calendar"
        subtitle="Holidays, shifts, birthdays, and team schedules — all in one place."
        icon={<CalendarDays className="h-5 w-5" />}
      />
      <CalendarView events={events as any} teamMembers={teamMembers} departments={departments as any} />
    </div>
  );
}
