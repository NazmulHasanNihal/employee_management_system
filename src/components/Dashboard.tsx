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
    { id: 'attendance', visible: true, order: 2 },
  ]);
  
  const { offlineQueue } = useAppStore();
  const { data: telemetry, isLoading: telLoading } = trpc.dashboard.getTelemetry.useQuery();
  const { data: userStats, isLoading: userLoading } = trpc.dashboard.getUserStats.useQuery(
    { userId: user?.id ?? '' }, 
    { enabled: !!user?.id }
  );
  const { data: announcements, isLoading: annLoading } = trpc.dashboard.getAnnouncements.useQuery();


  const radarData = [
    { subject: 'CPU', A: 120, fullMark: 150 },
    { subject: 'RAM', A: 98, fullMark: 150 },
    { subject: 'IO', A: 86, fullMark: 150 },
    { subject: 'NET', A: 99, fullMark: 150 },
    { subject: 'APP', A: 85, fullMark: 150 },
  ];

  const metrics = { activeEmployees: telemetry?.headcount ?? 0, pendingLeaves: telemetry?.pendingApps ?? 0, anomalies: 0 };



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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminWidgets 
            metrics={metrics} 
            layout={layout} 
            isEditMode={isEditMode} 
            radarData={radarData} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-xl">
            <div className={`absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-700 ${offlineQueue > 0 ? 'text-[var(--signal-amber)]' : 'text-[var(--verify-green)]'}`}>
              <Zap size={150} />
            </div>
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${offlineQueue > 0 ? 'from-[var(--signal-amber)]' : 'from-[var(--verify-green)]'} to-transparent`} />
            <p className="text-xs font-mono text-[var(--text-muted)] mb-4 uppercase tracking-widest relative z-10 flex items-center gap-2">
              <Clock size={14} /> Node Status
            </p>
            <div className="relative z-10 mt-auto pt-8">
              <h3 className={`text-4xl font-black tracking-tight ${offlineQueue > 0 ? 'text-[var(--signal-amber)]' : 'text-transparent bg-clip-text bg-gradient-to-r from-[var(--verify-green)] to-emerald-400'}`}>
                {offlineQueue > 0 ? 'QUEUED' : 'ACTIVE'}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {offlineQueue > 0 ? 'Syncing data when uplink is restored.' : 'Secure connection established.'}
              </p>
            </div>
          </div>

          {/* OKR Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-xl">
            <div className="absolute -right-10 -top-10 text-[var(--ledger-blue)] opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Target size={150} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ledger-blue)]/0 to-[var(--ledger-blue)]/5 group-hover:to-[var(--ledger-blue)]/10 transition-colors duration-500" />
            <p className="text-xs font-mono text-[var(--text-muted)] mb-4 uppercase tracking-widest relative z-10 flex items-center gap-2">
              <TrendingUp size={14} /> Current OKR Progress
            </p>
            <div className="relative z-10 mt-auto pt-8">
              <div className="flex items-end gap-2 mb-3">
                <h3 className="text-5xl font-black text-white">{userStats?.okr ?? 0}</h3>
                <span className="text-xl text-[var(--ledger-blue)] font-bold mb-1">%</span>
              </div>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="bg-gradient-to-r from-[var(--ledger-blue)] to-purple-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_var(--ledger-blue)]" 
                  style={{ width: `${userStats?.okr ?? 0}%` }}
                />
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
