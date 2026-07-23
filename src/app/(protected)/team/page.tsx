import { Users, Shield, Zap, Layers } from 'lucide-react';
import { getCaller } from '@/lib/auth';
import { getChainOfCommand, getTeamTasks, getTeamPerformance, getMyTeam } from '@/server/queries';
import { getServerT } from '@/lib/i18n-server';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';
import TeamTasksBoard from '@/components/team/TeamTasksBoard';
import TeamCompletionChartDynamic from '@/components/team/TeamCompletionChartDynamic';

export default async function TeamPage() {
  const caller = await getCaller();
  const t = await getServerT();
  const [chain, tasks, performance, myTeam] = await Promise.all([
    getChainOfCommand(caller),
    getTeamTasks(caller),
    getTeamPerformance(caller),
    getMyTeam(caller),
  ]);

  const isManager = caller?.isAdmin || caller?.isCEO || caller?.role === 'Manager' || caller?.role === 'Director';
  const members = myTeam.directReports.map((m) => ({
    id: m.id,
    name: m.name,
    designation: m.designation,
    avatarUrl: m.avatarUrl,
  }));

  // Team-level derived analytics from the per-member performance array.
  const teamSummary = (() => {
    if (performance.length === 0) return { avgCompletion: 0, totalDone: 0, totalBlocked: 0, blockedRate: 0, doneThisWeek: 0 };
    const totalTasks = performance.reduce((s, m: { totalTasks: number }) => s + (m.totalTasks || 0), 0);
    const totalDone = performance.reduce((s, m: { doneTasks: number }) => s + (m.doneTasks || 0), 0);
    const totalBlocked = performance.reduce((s, m: { blockedTasks: number }) => s + (m.blockedTasks || 0), 0);
    const doneThisWeek = performance.reduce((s, m: { doneThisWeek: number }) => s + (m.doneThisWeek || 0), 0);
    const avgCompletion = Math.round(performance.reduce((s: number, m: { completionRate: number }) => s + (m.completionRate || 0), 0) / performance.length);
    const blockedRate = totalTasks > 0 ? Math.round((totalBlocked / totalTasks) * 100) : 0;
    return { avgCompletion, totalDone, totalBlocked, blockedRate, doneThisWeek };
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('My Team')}
        subtitle={t('Chain of command, tasks, and team performance.')}
        icon={<Users className="h-5 w-5" />}
      />

      {/* Chain of Command */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--amber)]" /> Reporting Chain
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chain.chain.length === 0 ? (
            <EmptyState title={t('No reporting chain')} description={t('Your reporting structure will appear here.')} />
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {chain.chain.map((person, i) => (
                <div key={person.id} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`flex items-center gap-2 rounded-2xl border p-2 sm:p-3 ${
                      person.id === caller?.id
                        ? 'border-[var(--brand)]/40 bg-[var(--brand-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-hover)]/40'
                    }`}
                  >
                    <Avatar src={person.avatarUrl} name={person.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                        {person.name}
                        {person.id === caller?.id && (
                          <span className="ml-1 sm:ml-2 rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold uppercase text-[var(--brand-strong)]">You</span>
                        )}
                      </p>
                      <p className="hidden sm:block text-[11px] text-[var(--text-muted)]">{person.designation}</p>
                      <p className="text-[9px] sm:text-[10px] uppercase text-[var(--brand)]">{person.department}</p>
                    </div>
                  </div>
                  {i < chain.chain.length - 1 && <span className="hidden sm:inline text-[var(--text-muted)]">→</span>}
                </div>
              ))}
            </div>
          )}

          {chain.directReports.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Direct Reports ({chain.directReports.length})
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chain.directReports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3">
                    <Avatar src={r.avatarUrl} name={r.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-main)]">{r.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{r.designation}</p>
                      <p className="text-[10px] uppercase text-[var(--brand)]">{r.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chain.peers.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <Zap className="mr-1 inline h-3 w-3 text-[var(--brand)]" /> Team Peers ({chain.peers.length})
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {chain.peers.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-2">
                    <Avatar src={p.avatarUrl} name={p.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--text-main)]">{p.name}</p>
                      <p className="truncate text-[10px] text-[var(--text-muted)]">{p.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chain.secondLevelReports.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <Layers className="mr-1 inline h-3 w-3 text-[var(--sky)]" /> Extended Team
              </p>
              <div className="space-y-3">
                {chain.secondLevelReports.map((group) => (
                  <div key={group.managerId}>
                    <p className="mb-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      Reports to {group.managerName}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {group.reports.map((rep) => (
                        <div key={rep.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-2 text-xs">
                          <Avatar src={rep.avatarUrl} name={rep.name} size="sm" />
                          <span className="truncate text-[var(--text-main)]">{rep.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Board */}
      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamTasksBoard tasks={tasks} members={members} isManager={isManager} />
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {performance.length === 0 ? (
            <EmptyState title="No performance data" description="Team performance metrics will appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {performance.map((member) => {
                const statusColor =
                  member.completionRate >= 80 ? 'text-[var(--emerald)]' : member.completionRate >= 50 ? 'text-[var(--amber)]' : 'text-[var(--rose)]';
                const statusLabel =
                  member.completionRate >= 80 ? 'On Track' : member.completionRate >= 50 ? 'Needs Attention' : 'Behind';
                return (
                  <div key={member.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar src={member.avatarUrl} name={member.name} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-main)]">{member.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{member.designation}</p>
                      </div>
                      <span className={`ml-auto rounded-full border px-2 py-1 text-[8px] font-semibold uppercase ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between text-[10px] text-[var(--text-muted)]">
                          <span>Task Completion</span>
                          <span className={statusColor}>{member.completionRate}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                          <div className={`h-full rounded-full ${statusColor.replace('text-', 'bg-')}`} style={{ width: `${member.completionRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-[10px] text-[var(--text-muted)]">
                          <span>Attendance</span>
                          <span className="text-[var(--emerald)]">{member.attendanceRate}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                          <div className="h-full rounded-full bg-[var(--emerald)]" style={{ width: `${member.attendanceRate}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border-hairline)] pt-3 text-center">
                      <div>
                        <p className={`text-lg font-bold ${statusColor}`}>{member.totalTasks}</p>
                        <p className="text-[7px] uppercase text-[var(--text-muted)]">Total</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[var(--emerald)]">{member.doneTasks}</p>
                        <p className="text-[7px] uppercase text-[var(--text-muted)]">Done</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[var(--brand)]">{member.inProgressTasks}</p>
                        <p className="text-[7px] uppercase text-[var(--text-muted)]">Active</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team analytics: KPI strip + completion chart */}
      {performance.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="animate-fade-up">
               <p className="text-fluid-2xl font-semibold text-[var(--text-main)]">{teamSummary.avgCompletion}%</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Avg Completion</p>
            </Card>
            <Card className="animate-fade-up">
               <p className="text-fluid-2xl font-semibold text-[var(--emerald)]">{teamSummary.totalDone}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Tasks Completed</p>
            </Card>
            <Card className="animate-fade-up">
               <p className="text-fluid-2xl font-semibold text-[var(--brand)]">{teamSummary.doneThisWeek}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Done This Week</p>
            </Card>
            <Card className="animate-fade-up">
               <p className="text-fluid-2xl font-semibold text-[var(--rose)]">{teamSummary.blockedRate}%</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Blocked Rate</p>
            </Card>
          </div>
          <TeamCompletionChartDynamic
            data={performance.map((m: { name: string; completionRate: number }) => ({ name: m.name, completionRate: m.completionRate }))}
          />
        </>
      )}
    </div>
  );
}
