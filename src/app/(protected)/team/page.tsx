"use client";

import React from 'react';
import { Users, Clock, Target, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function TeamDashboardPage() {
  const { data: teamData, isLoading } = trpc.team.getMyTeam.useQuery();

  const directReports = teamData?.directReports || [];
  
  if (isLoading) {
    return <div className="text-center p-8 text-white font-mono animate-pulse">Loading Team Dashboard...</div>;
  }

  if (directReports.length === 0) {
    return (
      <div className="text-center text-[var(--text-muted)] py-12 font-mono border border-dashed border-white/10 rounded-2xl max-w-4xl mx-auto mt-8">
        You do not have any direct reports assigned to you.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-orange-400 to-amber-200 text-transparent bg-clip-text flex items-center gap-3">
            <Users className="text-orange-400" size={32} />
            My Team
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Oversee your direct reports' attendance, leave, and objectives.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {directReports.map((emp: any) => {
          const avgProgress = emp.objectives.length 
            ? Math.round(emp.objectives.reduce((acc: number, obj: any) => acc + obj.progress, 0) / emp.objectives.length)
            : 0;

          return (
            <div key={emp.id} className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl hover:border-orange-500/30 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold font-mono border border-orange-500/30">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{emp.name}</h3>
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase">{emp.designation}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* OKRs */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1"><Target size={12}/> Objectives</span>
                    <span className="text-xs font-mono text-orange-400">{avgProgress}% avg</span>
                  </div>
                  <div className="w-full bg-black h-1.5 rounded overflow-hidden">
                    <div className="h-full bg-orange-400" style={{ width: `${avgProgress}%` }} />
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1"><Clock size={12}/> Recent Attendance</span>
                  </div>
                  <div className="flex gap-1">
                    {emp.attendances.slice(0, 5).map((att: any, i: number) => (
                      <div 
                        key={i} 
                        title={new Date(att.date).toLocaleDateString() + ' - ' + att.status}
                        className={`flex-1 h-6 rounded ${
                          att.status === 'Present' ? 'bg-[var(--verify-green)]/40 border border-[var(--verify-green)]' :
                          att.status === 'Late' ? 'bg-[var(--signal-amber)]/40 border border-[var(--signal-amber)]' :
                          'bg-[var(--alert-red)]/40 border border-[var(--alert-red)]'
                        }`}
                      />
                    ))}
                    {emp.attendances.length === 0 && <span className="text-xs text-[var(--text-muted)] italic">No records</span>}
                  </div>
                </div>

                {/* Pending Leave */}
                {emp.leaveRequests.length > 0 && (
                  <div className="bg-[var(--signal-amber)]/10 rounded-xl p-3 border border-[var(--signal-amber)]/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-[var(--signal-amber)] flex items-center gap-1"><Calendar size={12}/> Pending Leave</span>
                      <span className="text-xs font-bold text-white bg-[var(--signal-amber)]/30 px-2 rounded">{emp.leaveRequests.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
