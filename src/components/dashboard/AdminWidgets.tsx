import React from 'react';
import { BrainCircuit, Users, Calendar, DollarSign, Activity, List, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export function AdminWidgets({ metrics, layout, isEditMode, radarData, deptBreakdown, auditLogs }: any) {
  return (
    <>
      {layout?.sort((a: any, b: any) => a.order - b.order).map((widget: any) => {
        if (!widget.visible && !isEditMode) return null;

        const WidgetWrapper = ({ children, colSpan = 2 }: { children: React.ReactNode, colSpan?: number }) => (
          <div className={`col-span-1 lg:col-span-${colSpan} relative transition-all duration-500 ${!widget.visible ? 'opacity-30 grayscale scale-95' : 'hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}`}>
            <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
              {children}
            </div>
          </div>
        );

        if (widget.id === 'metrics') return (
          <WidgetWrapper key="metrics" colSpan={3}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 h-full">
              <div className="p-6 bg-black/40 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase flex items-center gap-2 mb-2 relative z-10">
                  <Users size={14} className="text-[var(--verify-green)]" /> Total Headcount
                </span>
                <span className="text-4xl font-mono font-black text-[var(--verify-green)] relative z-10">
                  {metrics?.activeEmployees ?? 0}
                </span>
              </div>
              <div className="p-6 bg-black/40 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-bl from-[var(--ledger-blue)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase flex items-center gap-2 mb-2 relative z-10">
                  <Activity size={14} className="text-[var(--ledger-blue)]" /> Attendance Rate
                </span>
                <span className="text-4xl font-mono font-black text-white relative z-10">
                  {metrics?.attendanceRate ?? '0%'}
                </span>
              </div>
              <div className="p-6 bg-black/40 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--signal-amber)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase flex items-center gap-2 mb-2 relative z-10">
                  <Calendar size={14} className="text-[var(--signal-amber)]" /> Pending Leaves
                </span>
                <span className="text-4xl font-mono font-black text-white relative z-10">
                  {metrics?.pendingLeaves ?? 0}
                </span>
              </div>
              <div className="p-6 bg-black/40 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase flex items-center gap-2 mb-2 relative z-10">
                  <DollarSign size={14} className="text-purple-400" /> Payroll (MTD)
                </span>
                <span className="text-4xl font-mono font-black text-white relative z-10">
                  ${(metrics?.totalPayroll ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </WidgetWrapper>
        );

        if (widget.id === 'radar') return (
          <WidgetWrapper key="radar" colSpan={1}>
            <div className="p-6 h-full flex flex-col relative overflow-hidden min-h-[300px]">
              <h3 className="font-mono text-xs font-bold text-[var(--ledger-blue)] uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                <BrainCircuit size={16} /> HR Pulse Radar
              </h3>
              <div className="flex-1 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} />
                    <Radar name="Score" dataKey="A" stroke="var(--ledger-blue)" strokeWidth={2} fill="var(--ledger-blue)" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'var(--ledger-blue)', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </WidgetWrapper>
        );

        if (widget.id === 'dept') return (
          <WidgetWrapper key="dept" colSpan={1}>
            <div className="p-6 h-full flex flex-col relative overflow-hidden min-h-[300px]">
              <h3 className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                <PieChartIcon size={16} /> Dept Breakdown
              </h3>
              <div className="flex-1 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(deptBreakdown || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </WidgetWrapper>
        );

        if (widget.id === 'audit') return (
          <WidgetWrapper key="audit" colSpan={1}>
            <div className="p-6 h-full flex flex-col relative overflow-hidden min-h-[300px]">
              <h3 className="font-mono text-xs font-bold text-[var(--verify-green)] uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                <List size={16} /> Live Activity Feed
              </h3>
              <div className="flex-1 w-full relative z-10 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {auditLogs?.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {log.user?.image ? (
                        <img src={log.user.image} alt={log.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono">{log.user?.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-sans">
                        <span className="font-bold text-white">{log.user?.name || 'Unknown'}</span> performed action <span className="text-[var(--ledger-blue)]">{log.action}</span>
                      </p>
                      <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                        {formatTimeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!auditLogs || auditLogs.length === 0) && (
                  <p className="text-sm text-[var(--text-muted)] font-mono text-center mt-10">No recent activity.</p>
                )}
              </div>
            </div>
          </WidgetWrapper>
        );

        return null;
      })}
    </>
  );
}
