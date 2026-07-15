"use client";

import React from 'react';
import { Activity, Sparkles, Users, Clock, Calendar, DollarSign } from 'lucide-react';
import { StatCard, LiveClockWidget, QuickActionsWidget, EngagementWidget } from './dashboard/BentoWidgets';
import { Broadcasts } from './dashboard/Broadcasts';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const { language } = useAppStore();
  const t = useTranslation(language);
  
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const telemetry = stats || { headcount: 0, pendingApps: 0, activeToday: '0%', totalPayroll: 0 };

  const displayName = user?.name || 'User';
  const displayRole = user?.role || 'Employee';
  const displayDept = user?.department || '';
  const displayDesignation = user?.designation || '';
  const isAdmin = displayRole === 'Admin' || displayRole === 'HR Manager';

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
            {isAdmin ? t('Live Organization Overview & Analytics') : `${displayDesignation} • ${displayDept}`}
          </p>
        </div>
      </div>

      {/* BENTO BOX GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* LEFT BIG PANEL (Clock) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2">
          <LiveClockWidget />
        </div>

        {/* ANALYTICS: HR / ORG STATS (align in a neat 2x2) */}
        <div className="col-span-1 row-span-1">
          <StatCard
            title={t('Total Headcount')}
            value={telemetry.headcount}
            icon={Users}
            colorClass="text-[var(--verify-green)]"
            gradientFrom="from-[var(--verify-green)]/20"
          />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard
            title={t('Attendance Rate')}
            value={telemetry.activeToday}
            icon={Clock}
            colorClass="text-[var(--ledger-blue)]"
            gradientFrom="from-[var(--ledger-blue)]/20"
          />
        </div>

        <div className="col-span-1 row-span-1">
          <StatCard
            title={t('Pending Leaves')}
            value={telemetry.pendingApps}
            icon={Calendar}
            colorClass="text-[var(--signal-amber)]"
            gradientFrom="from-[var(--signal-amber)]/20"
          />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard
            title={t('Payroll (MTD)')}
            value={`$${(telemetry.totalPayroll || 0).toLocaleString()}`}
            icon={DollarSign}
            colorClass="text-purple-400"
            gradientFrom="from-purple-500/20"
          />
        </div>

        {/* Operational + HR actions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 row-span-2">
          <QuickActionsWidget />
        </div>

        {/* User/Employee analytics (recent activity) */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <EngagementWidget />
        </div>

        {/* Broadcasts */}
        <div className="col-span-1 md:col-span-2 row-span-2 h-full">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl h-full flex flex-col hover:border-white/20 transition-all duration-300">
            <Broadcasts announcements={[]} isLoading={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

