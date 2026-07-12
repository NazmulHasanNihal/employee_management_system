import React from 'react';
import { BrainCircuit, Users, Calendar, HeartPulse } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { trpc } from '@/lib/trpc/client';

export function AdminWidgets({ metrics, layout, isEditMode, radarData }: any) {
  return (
    <>
      {layout?.sort((a: any, b: any) => a.order - b.order).map((widget: any) => {
        if (!widget.visible && !isEditMode) return null;

        const WidgetWrapper = ({ children }: { children: React.ReactNode }) => (
          <div className={`col-span-1 lg:col-span-2 relative transition-all duration-500 ${!widget.visible ? 'opacity-30 grayscale scale-95' : 'hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}`}>
            <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
              {children}
            </div>
          </div>
        );

        if (widget.id === 'radar') return (
          <WidgetWrapper key="radar">
            <div className="p-6 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ledger-blue)]/20 rounded-full blur-3xl" />
              <h3 className="font-mono text-xs font-bold text-[var(--ledger-blue)] uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                <BrainCircuit size={16} /> System Load Radar
              </h3>
              <div className="flex-1 min-h-[280px] w-full -ml-4 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }} />
                    <Radar name="Load" dataKey="A" stroke="var(--ledger-blue)" strokeWidth={2} fill="var(--ledger-blue)" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'var(--ledger-blue)', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </WidgetWrapper>
        );

        if (widget.id === 'metrics') return (
          <WidgetWrapper key="metrics">
            <div className="grid grid-cols-2 gap-px bg-white/10 h-full">
              <div className="p-6 bg-black/40 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase flex items-center gap-2 mb-2 relative z-10">
                  <Users size={14} className="text-[var(--verify-green)]" /> Active Nodes
                </span>
                <span className="text-5xl font-mono font-black text-[var(--verify-green)] drop-shadow-[0_0_10px_rgba(0,255,0,0.3)] relative z-10">
                  {metrics?.activeEmployees ?? 0}
                </span>
              </div>
              <div className="p-6 bg-black/40 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-bl from-[var(--signal-amber)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase flex items-center gap-2 mb-2 relative z-10">
                  <Calendar size={14} className="text-[var(--signal-amber)]" /> Pending Leaves
                </span>
                <span className="text-5xl font-mono font-black text-white relative z-10">
                  {metrics?.pendingLeaves ?? 0}
                </span>
              </div>
            </div>
          </WidgetWrapper>
        );
        

        
        return null;
      })}
    </>
  );
}
