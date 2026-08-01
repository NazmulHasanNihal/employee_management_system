import { Users, Clock, CalendarClock, Ticket, DollarSign, Receipt, TrendingUp, GraduationCap, ArrowUpRight, BarChart3, Activity } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { getCaller } from '@/lib/auth';
import { getDashboardStats, getDashboardMyOverview, getTrainingCompliance } from '@/server/queries';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/ui/status-pill';
import { DeltaBadge } from '@/components/ui/delta-badge';
import AttendanceTrend from '@/components/dashboard/AttendanceTrendDynamic';
import LiveClock from '@/components/dashboard/LiveClock';
import { LeaveBreakdownDonut, ExpenseBreakdownDonut, DepartmentBar } from '@/components/dashboard/AnalyticsCharts';
import AttendanceMixDonutDynamic from '@/components/dashboard/AttendanceMixDonutDynamic';
import PayrollTrendDynamic from '@/components/dashboard/PayrollTrendDynamic';
import HeadcountTrendDynamic from '@/components/dashboard/HeadcountTrendDynamic';
import LeaveExpenseTrendDynamic from '@/components/dashboard/LeaveExpenseTrendDynamic';
import { PulseSurveyWidget } from '@/components/dashboard/PulseSurveyWidget';
import { PulseAnalyticsChart } from '@/components/dashboard/PulseAnalyticsChart';
import { formatCurrency, formatDate } from '@/lib/format';
import { getServerT } from '@/lib/i18n-server';
import { prisma } from '@/lib/prisma';
import { T } from "@/components/Translate";

export const dynamic = 'force-dynamic';

const currency = (n: number) => formatCurrency(n, 'BDT', 'en');

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  delta?: number;
  deltaLabel?: string;
  goodWhen: 'up' | 'down';
  description?: string;
}

export default async function DashboardPage() {
  const caller = await getCaller();
  const t = await getServerT();
  const isPrivilegedCaller = caller?.isAdmin || caller?.isCEO || caller?.isHR || false;

  const [stats, myOverview, trainingCompliance, officeSetting] = await Promise.all([
    getDashboardStats(caller),
    getDashboardMyOverview(caller),
    isPrivilegedCaller ? getTrainingCompliance(caller) : Promise.resolve(null),
    prisma.systemSetting.findUnique({ where: { key: 'officeHours' } }).catch(() => null),
  ]);

  const isAdmin = stats.isPrivileged;

  let officeHours: { start?: string; end?: string } | null = null;
  if (officeSetting?.value) {
    try {
      const parsed = JSON.parse(officeSetting.value);
      officeHours = { start: parsed.start, end: parsed.end };
    } catch {
      officeHours = null;
    }
  }

  const statCards: StatCard[] = [
    ...(isAdmin
      ? [{
          label: t('Headcount'),
          value: stats.headcount,
          icon: Users,
          tone: 'text-[var(--brand)] bg-[var(--brand-soft)]',
          delta: stats.headcountGrowthPct,
          deltaLabel: 'vs prior 30d',
          goodWhen: 'up' as const,
          description: 'Active employees across all departments',
        }]
      : []),
    {
      label: t('Attendance Rate'),
      value: `${stats.attendanceRate}%`,
      icon: Clock,
      tone: 'text-[var(--emerald)] bg-[var(--emerald-soft)]',
      delta: stats.attendanceDelta,
      deltaLabel: 'vs prior 7d',
      goodWhen: 'up' as const,
      description: 'Average attendance across the organization',
    },
    {
      label: t('Pending Leaves'),
      value: stats.pendingLeaves,
      icon: CalendarClock,
      tone: 'text-[var(--amber)] bg-[var(--amber-soft)]',
      delta: -stats.leaveDeltaPct,
      deltaLabel: 'leave vol. MoM',
      goodWhen: 'down' as const,
      description: 'Leave requests awaiting approval',
    },
    {
      label: isAdmin ? t('Payroll (Me)') : t('My Payroll'),
      value: currency(stats.totalPayroll),
      icon: DollarSign,
      tone: 'text-[var(--sky)] bg-[var(--sky-soft)]',
      delta: stats.payrollDeltaPct,
      deltaLabel: 'run-rate MoM',
      goodWhen: 'up' as const,
      description: 'Total payroll processed this period',
    },
    {
      label: t('My Expenses'),
      value: currency(stats.totalExpenses),
      icon: Receipt,
      tone: 'text-[var(--brand)] bg-[var(--brand-soft)]',
      delta: stats.expenseDeltaPct,
      deltaLabel: 'spend MoM',
      goodWhen: 'down' as const,
      description: 'Total expenses claimed this month',
    },
  ];

  if (trainingCompliance) {
    statCards.push({
      label: t('Training Compliance'),
      value: `${trainingCompliance.pct}%`,
      icon: GraduationCap,
      tone: 'text-[var(--violet, var(--brand))] bg-[var(--brand-soft)]',
      goodWhen: 'up' as const,
      description: 'Employees with completed mandatory training',
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title={t('Dashboard')}
        subtitle={caller ? `${t('Welcome back')}, ${caller.name}` : t('Organization overview')}
        icon={<TrendingUp className="h-5 w-5" />}
      />

      {/* Key Metrics */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--brand)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Key Metrics</T></h2>
        </div>
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
          {statCards.map((s) => (
            <Card key={s.label} className="animate-fade-up group hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col justify-center">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.tone} transition-transform duration-200 group-hover:scale-105`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-fluid-2xl font-semibold text-[var(--text-main)]">{s.value}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs font-medium text-[var(--text-muted)]">{s.label}</p>
                  {typeof s.delta === 'number' && (
                    <DeltaBadge value={s.delta} goodWhen={s.goodWhen} />
                  )}
                </div>
                {s.deltaLabel && (
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{s.deltaLabel}</p>
                )}
                {s.description && (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)] opacity-80">{s.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Attendance & Department */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--emerald)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Attendance & Department</T></h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <LiveClock officeHours={officeHours} />
          <div className="lg:col-span-2">
            <AttendanceTrend data={stats.attendanceTrend} />
          </div>

          {isAdmin ? (
            <DepartmentBar data={stats.departmentBreakdown} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{/* @ts-ignore */}<T>My Department</T></CardTitle>
              </CardHeader>
              <CardContent>
                {stats.departmentBreakdown.length === 0 ? (
                  <EmptyState title="No department assigned" description="Contact HR to be added to a department." />
                ) : (
                  <div className="space-y-3">
                    {stats.departmentBreakdown.map((d) => {
                      const pct = stats.headcount > 0 ? Math.round((d.count / stats.headcount) * 100) : 0;
                      return (
                        <div key={d.name}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-[var(--text-main)]">{d.name}</span>
                            <span className="text-[var(--text-muted)]">{d.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                            <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Admin Analytics */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Organization Analytics</T></h2>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LeaveBreakdownDonut data={stats.leaveBreakdown} />
            <ExpenseBreakdownDonut data={stats.expenseBreakdown} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AttendanceMixDonutDynamic data={stats.attendanceMix} />
            <PayrollTrendDynamic data={stats.trendSeries.map((d) => ({ month: d.month, payroll: d.payroll }))} />
            <HeadcountTrendDynamic data={stats.trendSeries.map((d) => ({ month: d.month, headcount: d.headcount }))} />
          </div>
          <LeaveExpenseTrendDynamic
            leave={[
              { period: 'Last Mo', value: stats.leaveLastMonth },
              { period: 'This Mo', value: stats.leaveThisMonth },
            ]}
            expense={[
              { period: 'Last Mo', value: stats.expenseLastMonth },
              { period: 'This Mo', value: stats.expenseThisMonth },
            ]}
          />
          <PulseAnalyticsChart />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="animate-fade-up">
              <p className="text-2xl font-semibold text-[var(--text-main)]">{currency(stats.payrollRunRate)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Monthly Payroll Run-Rate</T></p>
            </Card>
            <Card className="animate-fade-up">
              <p className="text-2xl font-semibold text-[var(--text-main)]">{currency(stats.payrollYTD)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Payroll YTD</T></p>
            </Card>
            <Card className="animate-fade-up">
              <p className="text-2xl font-semibold text-[var(--text-main)]">{stats.leaveApprovalRate}%</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Leave Approval Rate (Mo)</T></p>
            </Card>
            <Card className="animate-fade-up">
              <p className="text-2xl font-semibold text-[var(--text-main)]">{currency(stats.pendingExpenseAmount)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Pending Expenses</T></p>
            </Card>
          </div>
        </section>
      )}

      {/* Upcoming Events & News */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-[var(--brand)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>What's Happening</T></h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <PulseSurveyWidget />
            <Card>
              <CardHeader>
                <CardTitle>{/* @ts-ignore */}<T>Upcoming Events</T></CardTitle>
              </CardHeader>
            <CardContent>
              {stats.upcomingEvents.length === 0 ? (
                <EmptyState title="No upcoming events" description="Calendar events will appear here." />
              ) : (
                <ul className="space-y-3">
                  {stats.upcomingEvents.map((ev, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3 transition-colors hover:bg-[var(--bg-hover)]">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                        <span className="text-[10px] font-semibold uppercase">
                          {new Date(ev.date).toLocaleDateString('en', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold">{new Date(ev.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-main)]">{ev.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{ev.type}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{/* @ts-ignore */}<T>Recent News</T></CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentNews.length === 0 ? (
                <EmptyState title="No news yet" description="Company announcements will show up here." />
              ) : (
                <ul className="space-y-3">
                  {stats.recentNews.map((n, i) => (
                    <li key={i} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3 transition-colors hover:bg-[var(--bg-hover)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-[var(--text-main)]">{n.title}</p>
                        <Badge variant={n.priority === 'High' || n.priority === 'Emergency' ? 'rose' : 'secondary'}>
                          {n.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {n.authorName} · {formatDate(n.createdAt, 'en')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* My Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('My Overview')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!myOverview ? (
                <EmptyState title="No overview" description="Sign in to see your personal stats." />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="rounded-xl bg-[var(--bg-hover)]/60 p-3">
                      <p className="text-xl font-semibold text-[var(--text-main)]">{myOverview.attendancePercent}%</p>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>My Attendance</T></p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-hover)]/60 p-3">
                      <p className="text-xl font-semibold text-[var(--text-main)]">{myOverview.myPendingLeaves}</p>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Pending Leaves</T></p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-hover)]/60 p-3">
                      <p className="text-xl font-semibold text-[var(--text-main)]">{myOverview.myDoneTasks}/{myOverview.myTotalTasks}</p>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Tasks Done</T></p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-hover)]/60 p-3">
                      <p className="text-xl font-semibold text-[var(--text-main)]">{myOverview.myInProgressTasks}</p>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>In Progress</T></p>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-hover)]/60 p-3">
                      <p className="text-xl font-semibold text-[var(--text-main)]">{stats.taskCompletionRate}%</p>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Task Completion</T></p>
                    </div>
                  </div>

                  {myOverview.myRecentPayrolls.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Recent Payrolls</T></p>
                      <ul className="space-y-2">
                        {myOverview.myRecentPayrolls.map((p, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-main)]">{p.month} {p.year}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-[var(--text-muted)]">{currency(p.totalAmount)}</span>
                              <StatusPill
                                status={p.status === 'Paid' ? 'success' : p.status === 'Pending' ? 'pending' : 'info'}
                                label={p.status}
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
