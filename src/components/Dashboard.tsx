"use client";

import React from 'react';
import { 
  Activity, Sparkles, Users, Clock, Calendar, DollarSign, 
  TrendingUp, BarChart3, PieChart, CheckCircle2, AlertTriangle,
  Briefcase, Target, FileText, Megaphone
} from 'lucide-react';
import { 
  StatCard, LiveClockWidget, QuickActionsWidget, EngagementWidget,
  DepartmentBreakdownChart, AttendanceTrendChart, LeaveBreakdownChart,
  TaskCompletionWidget, UpcomingEventsWidget, MyStatsWidget, ExpenseBreakdownChart,
  RecentNewsWidget
} from './dashboard/BentoWidgets';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const { language } = useAppStore();
  const t = useTranslation(language);
  
  const { data: stats } = trpc.dashboard.getFullStats.useQuery();
  const { data: myOverview } = trpc.dashboard.getMyOverview.useQuery();

  const displayName = user?.name || 'User';
  const displayRole = user?.role || 'Employee';
  const displayDept = user?.department || '';
  const displayDesignation = user?.designation || '';
  const isAdmin = displayRole === 'Admin' || displayRole === 'HR Manager';
  const isManager = displayRole === 'Manager';

  const fullStats = stats || {
    headcount: 0, attendanceRate: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0,
    totalPayroll: 0, totalExpenses: 0, pendingExpenses: 0, openTickets: 0,
    attendanceTrend: [], departmentBreakdown: [], leaveBreakdown: [], expenseBreakdown: [],
    totalTasks: 0, doneTasks: 0, inProgressTasks: 0, blockedTasks: 0,
    recentHires: [], upcomingEvents: [], recentNews: []
  };

  const overview = myOverview || {
    attendancePercent: 0, myPendingLeaves: 0, myApprovedLeaves: 0,
    myTotalTasks: 0, myDoneTasks: 0, myInProgressTasks: 0, myPendingTasks: 0,
    myRecentPayrolls: [], myUpcomingEvents: []
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <Activity className="text-[var(--ledger-blue)]" size={36} />
            {isAdmin ? t('System Telemetry') : t('Command Center')}
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            {isAdmin ? t('Live Organization Overview & Analytics') : `${t('Welcome back')}, ${displayName} • ${displayDesignation}`}
          </p>
        </div>
      </div>

      {/* BENTO BOX GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* LEFT BIG PANEL (Clock) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2">
          <LiveClockWidget />
        </div>

        {/* KPI Stat Cards */}
        <div className="col-span-1 row-span-1">
          <StatCard
            title={isAdmin ? t('Total Headcount') : t('My Attendance')}
            value={isAdmin ? fullStats.headcount : `${overview.attendancePercent}%`}
            icon={Users}
            colorClass="text-[var(--verify-green)]"
            gradientFrom="from-[var(--verify-green)]/20"
          />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard
            title={isAdmin ? t('Attendance Rate') : t('My Tasks')}
            value={isAdmin ? `${fullStats.attendanceRate}%` : overview.myTotalTasks}
            icon={isAdmin ? Clock : Target}
            colorClass="text-[var(--ledger-blue)]"
            gradientFrom="from-[var(--ledger-blue)]/20"
            subtitle={isAdmin ? undefined : `${overview.myDoneTasks} done · ${overview.myInProgressTasks} in progress`}
          />
        </div>

        <div className="col-span-1 row-span-1">
          <StatCard
            title={isAdmin ? t('Pending Leaves') : t('Pending Leaves')}
            value={isAdmin ? fullStats.pendingLeaves : overview.myPendingLeaves}
            icon={Calendar}
            colorClass="text-[var(--signal-amber)]"
            gradientFrom="from-[var(--signal-amber)]/20"
          />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard
            title={isAdmin ? t('Payroll (MTD)') : t('Open Tickets')}
            value={isAdmin ? `$${(fullStats.totalPayroll || 0).toLocaleString()}` : (fullStats.openTickets || 0)}
            icon={isAdmin ? DollarSign : FileText}
            colorClass="text-purple-400"
            gradientFrom="from-purple-500/20"
          />
        </div>

        {/* Task Overview (4 mini stats) — Admin/Manager only */}
        {(isAdmin || isManager) && (
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl hover:border-white/20 transition-all duration-300">
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={16} className="text-cyan-400" /> {t('Task Overview')}
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-black/30 rounded-2xl border border-white/5">
                  <p className="text-2xl font-mono font-black text-white">{fullStats.totalTasks}</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Total</p>
                </div>
                <div className="text-center p-3 bg-[var(--verify-green)]/10 rounded-2xl border border-[var(--verify-green)]/20">
                  <p className="text-2xl font-mono font-black text-[var(--verify-green)]">{fullStats.doneTasks}</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Done</p>
                </div>
                <div className="text-center p-3 bg-[var(--ledger-blue)]/10 rounded-2xl border border-[var(--ledger-blue)]/20">
                  <p className="text-2xl font-mono font-black text-[var(--ledger-blue)]">{fullStats.inProgressTasks}</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Active</p>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <p className="text-2xl font-mono font-black text-red-400">{fullStats.blockedTasks}</p>
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Blocked</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Admin Stats */}
        {isAdmin && (
          <>
            <div className="col-span-1 row-span-1">
              <StatCard
                title={t('Total Expenses')}
                value={`$${(fullStats.totalExpenses || 0).toLocaleString()}`}
                icon={DollarSign}
                colorClass="text-orange-400"
                gradientFrom="from-orange-500/20"
                subtitle={`${fullStats.pendingExpenses} pending`}
              />
            </div>
            <div className="col-span-1 row-span-1">
              <StatCard
                title={t('Open Tickets')}
                value={fullStats.openTickets}
                icon={AlertTriangle}
                colorClass="text-red-400"
                gradientFrom="from-red-500/20"
              />
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 row-span-2">
          <QuickActionsWidget />
        </div>

        {/* Charts Section — Admin Only */}
        {isAdmin && (
          <>
            {/* Attendance Trend */}
            <div className="col-span-1 md:col-span-2 row-span-2">
              <AttendanceTrendChart data={fullStats.attendanceTrend} />
            </div>

            {/* Department Breakdown */}
            <div className="col-span-1 md:col-span-2 row-span-2">
              <DepartmentBreakdownChart data={fullStats.departmentBreakdown} />
            </div>

            {/* Leave Breakdown */}
            <div className="col-span-1 md:col-span-2 row-span-2">
              <LeaveBreakdownChart data={fullStats.leaveBreakdown} />
            </div>

            {/* Expense Breakdown */}
            <div className="col-span-1 md:col-span-2 row-span-2">
              <ExpenseBreakdownChart data={fullStats.expenseBreakdown} />
            </div>
          </>
        )}

        {/* Task Completion Widget — Manager or Employee */}
        {!isAdmin && (
          <div className="col-span-1 md:col-span-2 row-span-2">
            <MyStatsWidget overview={overview} />
          </div>
        )}

        {/* Upcoming Events */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <UpcomingEventsWidget events={isAdmin ? fullStats.upcomingEvents : overview.myUpcomingEvents} />
        </div>

        {/* Recent News */}
        {isAdmin && (
          <div className="col-span-1 md:col-span-2 row-span-2">
            <RecentNewsWidget news={fullStats.recentNews} />
          </div>
        )}

        {/* Recent Activity / Engagement */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <EngagementWidget />
        </div>
      </div>
    </div>
  );
}
