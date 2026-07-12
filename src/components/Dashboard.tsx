"use client";

import React, { useState } from 'react';
import { 
  Activity, Sparkles, Settings2, Zap, Clock, Target, TrendingUp, HeartPulse
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

import { AdminWidgets } from './dashboard/AdminWidgets';
import { Broadcasts } from './dashboard/Broadcasts';

export default function Dashboard() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = session?.user as { id: string; name: string; email: string; role: string; department: string; designation: string } | undefined;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState([
    { id: 'metrics', visible: true, order: 0 },
    { id: 'radar', visible: true, order: 1 },
    { id: 'dept', visible: true, order: 2 },
    { id: 'audit', visible: true, order: 3 },
  ]);
  
  const { offlineQueue } = useAppStore();
  const { data: telemetry, isLoading: telLoading } = trpc.dashboard.getTelemetry.useQuery();
  const { data: userStats, isLoading: userLoading } = trpc.dashboard.getUserStats.useQuery(
    { userId: user?.id ?? '' }, 
    { enabled: !!user?.id }
  );
  const { data: announcements, isLoading: annLoading } = trpc.dashboard.getAnnouncements.useQuery();
  const { data: deptBreakdown } = trpc.dashboard.getDepartmentBreakdown.useQuery(undefined, { enabled: user?.role === 'Admin' });
  const { data: auditLogs } = trpc.dashboard.getAuditLogs.useQuery(undefined, { enabled: user?.role === 'Admin' });

  const radarData = [
    { subject: 'Retention', A: 85, fullMark: 100 },
    { subject: 'Satisfaction', A: 92, fullMark: 100 },
    { subject: 'Performance', A: 78, fullMark: 100 },
    { subject: 'Compensation', A: 88, fullMark: 100 },
    { subject: 'Diversity', A: 75, fullMark: 100 },
  ];

  const metrics = { 
    activeEmployees: telemetry?.headcount ?? 0, 
    pendingLeaves: telemetry?.pendingApps ?? 0, 
    attendanceRate: telemetry?.activeToday ?? '0%',
    totalPayroll: telemetry?.totalPayroll ?? 0
  };

  if (telLoading || userLoading || sessionLoading || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--ledger-blue)] border-t-transparent animate-spin shadow-[0_0_15px_var(--ledger-blue)]" />
          <p className="font-mono text-sm uppercase tracking-widest text-[var(--ledger-blue)] animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-0">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-purple-400 text-transparent bg-clip-text flex items-center gap-3">
            <Activity className="text-[var(--ledger-blue)]" size={32} />
            {user.role === 'Admin' ? 'System Telemetry' : 'Command Center'}
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            <Sparkles size={14} className="text-purple-400" />
            {user.role === 'Admin' ? 'Live Organization Overview & Analytics' : `${user.designation} • ${user.department}`}
          </p>
        </div>
        
        {user.role === 'Admin' && (
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`mt-4 md:mt-0 px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center gap-2 ${
              isEditMode 
                ? 'bg-[var(--ledger-blue)] text-black shadow-[0_0_20px_var(--ledger-blue)] scale-105' 
                : 'bg-white/5 text-[var(--text-main)] hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10'
            }`}
          >
            <Settings2 size={14} /> {isEditMode ? 'Save Layout' : 'Customize Board'}
          </button>
        )}
      </div>

      {user.role === 'Admin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <AdminWidgets 
              metrics={metrics} 
              layout={layout} 
              isEditMode={isEditMode} 
              radarData={radarData} 
              deptBreakdown={deptBreakdown}
              auditLogs={auditLogs}
            />
          </div>
          <div className="col-span-1 space-y-6">
            {/* Quick Actions Toolbar */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-[var(--ledger-blue)]/20 hover:text-[var(--ledger-blue)] border border-white/10 rounded-xl transition-all">
                  <Activity size={20} className="mb-2" />
                  <span className="text-xs font-mono">Add Employee</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 border border-white/10 rounded-xl transition-all">
                  <Target size={20} className="mb-2" />
                  <span className="text-xs font-mono">Run Payroll</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-[var(--verify-green)]/20 hover:text-[var(--verify-green)] border border-white/10 rounded-xl transition-all">
                  <Clock size={20} className="mb-2" />
                  <span className="text-xs font-mono">Leaves</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-[var(--signal-amber)]/20 hover:text-[var(--signal-amber)] border border-white/10 rounded-xl transition-all">
                  <Zap size={20} className="mb-2" />
                  <span className="text-xs font-mono">Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Time & Attendance */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
              <Clock size={16} className="text-[var(--ledger-blue)]" /> Time & Attendance
            </h3>
            <div className="text-center">
              <p className="text-4xl font-mono text-white mb-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[var(--text-muted)] mb-8">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <button className="w-full py-3 bg-[var(--ledger-blue)]/20 hover:bg-[var(--ledger-blue)]/40 text-[var(--ledger-blue)] border border-[var(--ledger-blue)]/50 rounded-xl font-bold font-mono transition-all">
                CLOCK IN
              </button>
            </div>
          </div>

          {/* OKR & Balances */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
              <Target size={16} className="text-purple-400" /> My Progress
            </h3>
            <div className="mb-6">
              <div className="flex justify-between text-xs text-white mb-2">
                <span>Current OKR</span>
                <span>{userStats?.okr ?? 0}%</span>
              </div>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="bg-gradient-to-r from-[var(--ledger-blue)] to-purple-500 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${userStats?.okr ?? 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-4 mt-auto">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase">PTO Balance</p>
                <p className="text-xl font-bold text-white">14 <span className="text-xs font-normal">days</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)] uppercase">Next Payday</p>
                <p className="text-xl font-bold text-[var(--verify-green)]">30th</p>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-xl flex flex-col">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[var(--signal-amber)]" /> Action Items
            </h3>
            <div className="flex-1 space-y-3">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex justify-between items-center group cursor-pointer hover:border-white/20 transition-all">
                <span className="text-sm text-white group-hover:text-[var(--ledger-blue)] transition-colors">Complete Onboarding Docs</span>
                <span className="w-2 h-2 bg-[var(--signal-amber)] rounded-full animate-pulse" />
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex justify-between items-center group cursor-pointer hover:border-white/20 transition-all">
                <span className="text-sm text-white group-hover:text-[var(--ledger-blue)] transition-colors">Acknowledge IT Policy</span>
                <span className="w-2 h-2 bg-[var(--verify-green)] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pt-4">
        <Broadcasts announcements={announcements ?? []} isLoading={annLoading} />
      </div>

    </div>
  );
}
