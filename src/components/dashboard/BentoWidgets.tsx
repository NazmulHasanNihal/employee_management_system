"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Calendar, DollarSign, BrainCircuit, 
  UserPlus, Target, Clock, Zap, Cake, Gift, HeartPulse, MoreHorizontal,
  TrendingUp, BarChart3, PieChart as PieChartIcon, CheckCircle2, CalendarDays,
  Megaphone, ArrowUpRight, AlertTriangle, Briefcase, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';

const BENTO_CLASSES = "bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl relative transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_24px_rgb(0,0,0,0.18)]";

const CHART_COLORS = ['#00C3FF', '#00E676', '#FFB300', '#FF5252', '#7C4DFF', '#FF6D00', '#00E5FF', '#69F0AE'];

// --- 1. STAT CARD ---
export function StatCard({ title, value, icon: Icon, colorClass, gradientFrom, subtitle }: any) {
  return (
    <div className={`${BENTO_CLASSES} flex flex-col justify-between p-6 group h-full`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0`} />

      <div className="flex justify-between items-start z-10">
        <div className={`p-3 rounded-2xl bg-black/40 border border-white/5 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <button className="text-white/20 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="z-10 mt-6">
        <div className="flex items-center gap-2">
          <h4 className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest">{title}</h4>
        </div>
        <p className="text-3xl lg:text-4xl font-mono font-black text-white mt-2 leading-none">{value}</p>
        {subtitle && (
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
    </div>
  );
}


// --- 2. LIVE CLOCK & SHIFT ---
export function LiveClockWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className={`${BENTO_CLASSES} h-full p-8 animate-pulse`} />;

  const hours = time.getHours();
  const shiftStatus = hours >= 9 && hours < 17 ? 'Active Shift' : 'Off-Hours';
  const shiftColor = hours >= 9 && hours < 17 ? 'text-[var(--verify-green)]' : 'text-[var(--signal-amber)]';

  return (
    <div className={`${BENTO_CLASSES} h-full p-8 flex flex-col justify-center relative overflow-hidden group`}>
<div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--ledger-blue)]/10 to-transparent blur-2xl rounded-full -mr-20 -mt-20 group-hover:scale-105 transition-transform duration-700" />
      
      <div className="flex justify-between items-end relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${hours >= 9 && hours < 17 ? 'bg-[var(--verify-green)] animate-pulse' : 'bg-[var(--signal-amber)]'}`} />
            <span className={`text-xs font-mono uppercase tracking-widest ${shiftColor}`}>
              {shiftStatus}
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-mono font-black text-white tracking-tighter">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p className="text-sm font-sans text-[var(--text-muted)] mt-2">
            {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <div className="hidden sm:block text-right">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Timezone</p>
          <p className="text-sm font-bold text-white">Local / System</p>
        </div>
      </div>
    </div>
  );
}

// --- 3. ATTENDANCE TREND CHART ---
export function AttendanceTrendChart({ data }: { data: any[] }) {
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6 min-h-[320px]`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--ledger-blue)]" /> Attendance Trend
        </h3>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Last 7 Days</span>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C3FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00C3FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} unit="%" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
              formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
            />
            <Area type="monotone" dataKey="rate" stroke="#00C3FF" strokeWidth={2} fill="url(#attendanceGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- 4. DEPARTMENT BREAKDOWN CHART ---
export function DepartmentBreakdownChart({ data }: { data: any[] }) {
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6 min-h-[320px]`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--verify-green)]" /> Department Breakdown
        </h3>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Headcount</span>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'monospace' }} width={80} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- 5. LEAVE BREAKDOWN CHART ---
export function LeaveBreakdownChart({ data }: { data: any[] }) {
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6 min-h-[320px]`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <PieChartIcon size={16} className="text-[var(--signal-amber)]" /> Leave Breakdown
        </h3>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">By Type</span>
      </div>
      <div className="flex-1 w-full flex items-center">
        {data.length === 0 ? (
          <div className="w-full text-center text-[10px] font-mono text-[var(--text-muted)] uppercase">No leave data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={3}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {data.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--text-muted)] uppercase">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              {item.type} ({item.count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- 6. EXPENSE BREAKDOWN CHART ---
export function ExpenseBreakdownChart({ data }: { data: any[] }) {
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6 min-h-[320px]`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <DollarSign size={16} className="text-orange-400" /> Expense Breakdown
        </h3>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">By Category</span>
      </div>
      <div className="flex-1 w-full">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-[var(--text-muted)] uppercase">No expense data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'monospace' }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// --- 7. TASK COMPLETION WIDGET ---
export function TaskCompletionWidget({ totalTasks, doneTasks, inProgressTasks, blockedTasks }: any) {
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6 min-h-[280px]`}>
      <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
        <Target size={16} className="text-cyan-400" /> Task Completion
      </h3>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="transparent" stroke="#00C3FF" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-black text-white">{completionRate}%</span>
            <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">Complete</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 bg-[var(--verify-green)]/10 rounded-xl">
          <p className="text-sm font-mono font-bold text-[var(--verify-green)]">{doneTasks}</p>
          <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase">Done</p>
        </div>
        <div className="text-center p-2 bg-[var(--ledger-blue)]/10 rounded-xl">
          <p className="text-sm font-mono font-bold text-[var(--ledger-blue)]">{inProgressTasks}</p>
          <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase">Active</p>
        </div>
        <div className="text-center p-2 bg-red-500/10 rounded-xl">
          <p className="text-sm font-mono font-bold text-red-400">{blockedTasks}</p>
          <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase">Blocked</p>
        </div>
      </div>
    </div>
  );
}

// --- 8. MY STATS WIDGET (for non-admin users) ---
export function MyStatsWidget({ overview }: { overview: any }) {
  const taskCompletion = overview.myTotalTasks > 0 ? Math.round((overview.myDoneTasks / overview.myTotalTasks) * 100) : 0;
  
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6`}>
      <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
        <Activity size={16} className="text-cyan-400" /> My Performance
      </h3>
      
      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Attendance */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="#00E676" strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 - (overview.attendancePercent / 100) * 2 * Math.PI * 42} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-black text-white">{overview.attendancePercent}%</span>
          </div>
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Attendance</p>
        </div>

        {/* Task Completion */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="transparent" stroke="#00C3FF" strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 - (taskCompletion / 100) * 2 * Math.PI * 42} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-black text-white">{taskCompletion}%</span>
          </div>
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Tasks Done</p>
        </div>

        {/* Leaves */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center">
          <p className="text-3xl font-mono font-black text-[var(--signal-amber)]">{overview.myPendingLeaves}</p>
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Pending Leaves</p>
        </div>

        {/* Pending Tasks */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center">
          <p className="text-3xl font-mono font-black text-purple-400">{overview.myPendingTasks}</p>
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Pending Tasks</p>
        </div>
      </div>

      {/* Recent Payrolls */}
      {overview.myRecentPayrolls && overview.myRecentPayrolls.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Recent Payslips</p>
          <div className="space-y-2">
            {overview.myRecentPayrolls.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs font-mono">
                <span className="text-white">{p.month} {p.year}</span>
                <span className="text-[var(--verify-green)]">${(p.totalAmount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 9. UPCOMING EVENTS WIDGET ---
export function UpcomingEventsWidget({ events }: { events: any[] }) {
  const router = useRouter();
  const typeColors: Record<string, string> = {
    'Holiday': 'text-[var(--signal-amber)] bg-[var(--signal-amber)]/10 border-[var(--signal-amber)]/20',
    'Meeting': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Payroll': 'text-[var(--verify-green)] bg-[var(--verify-green)]/10 border-[var(--verify-green)]/20',
    'Task': 'text-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]/20',
    'Reminder': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <CalendarDays size={16} className="text-cyan-400" /> Upcoming Events
        </h3>
        <button onClick={() => router.push('/calendar')} className="text-[10px] font-mono text-[var(--ledger-blue)] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
          View All <ArrowUpRight size={12} />
        </button>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {(!events || events.length === 0) ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-[var(--text-muted)] uppercase">No upcoming events</div>
        ) : (
          events.map((event: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors border border-transparent hover:border-white/5">
              <div className={`p-2 rounded-lg border ${typeColors[event.type] || 'text-white bg-white/5 border-white/10'}`}>
                <CalendarDays size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{event.title}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {event.type}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- 10. RECENT NEWS WIDGET ---
export function RecentNewsWidget({ news }: { news: any[] }) {
  const router = useRouter();
  const priorityColors: Record<string, string> = {
    'Emergency': 'text-red-400 bg-red-500/20 border-red-500/30',
    'High': 'text-red-400 bg-red-500/10 border-red-500/20',
    'Medium': 'text-[var(--signal-amber)] bg-[var(--signal-amber)]/10 border-[var(--signal-amber)]/20',
    'Low': 'text-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]/20',
  };

  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Megaphone size={16} className="text-purple-400" /> Recent News
        </h3>
        <button onClick={() => router.push('/announcements')} className="text-[10px] font-mono text-[var(--ledger-blue)] hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
          View All <ArrowUpRight size={12} />
        </button>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {(!news || news.length === 0) ? (
          <div className="flex items-center justify-center h-full text-[10px] font-mono text-[var(--text-muted)] uppercase">No recent news</div>
        ) : (
          news.map((item: any, i: number) => (
            <div key={i} className="p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors border border-transparent hover:border-white/5 cursor-pointer" onClick={() => router.push('/announcements')}>
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-bold text-white truncate flex-1">{item.title}</p>
                <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded-full border ml-2 shrink-0 ${priorityColors[item.priority] || ''}`}>
                  {item.priority}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--text-muted)]">
                {item.authorName} · {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- 11. QUICK ACTIONS COMMAND CENTER ---
export function QuickActionsWidget() {
  const router = useRouter();
  
  const actions = [
    { name: 'Add Member', icon: UserPlus, color: 'text-[var(--verify-green)]', bg: 'hover:bg-[var(--verify-green)]/10', border: 'hover:border-[var(--verify-green)]/30', path: '/registry' },
    { name: 'Run Payroll', icon: Target, color: 'text-purple-400', bg: 'hover:bg-purple-500/10', border: 'hover:border-purple-500/30', path: '/payroll' },
    { name: 'Approve Leaves', icon: Calendar, color: 'text-[var(--signal-amber)]', bg: 'hover:bg-[var(--signal-amber)]/10', border: 'hover:border-[var(--signal-amber)]/30', path: '/leave' },
    { name: 'Broadcast', icon: Zap, color: 'text-[var(--ledger-blue)]', bg: 'hover:bg-[var(--ledger-blue)]/10', border: 'hover:border-[var(--ledger-blue)]/30', path: '/announcements' },
  ];

  return (
    <div className={`${BENTO_CLASSES} h-full p-6 flex flex-col`}>
      <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
        <Activity size={16} className="text-orange-400" /> Command Center
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {actions.map((action, i) => {
          const ActionIcon = action.icon;
          return (
          <button 
            key={i} 
            onClick={() => router.push(action.path)}
            className={`flex flex-col items-center justify-center p-4 bg-black/40 border border-white/5 rounded-2xl transition-all duration-300 group ${action.bg} ${action.border}`}
          >
            <ActionIcon size={24} className={`${action.color} mb-3 group-hover:scale-110 transition-transform`} />
            <span className="text-xs font-mono font-bold text-white/70 group-hover:text-white">{action.name}</span>
          </button>
          );
        })}
      </div>
    </div>
  );
}

// --- 12. ENGAGEMENT / EVENTS (from DB) ---
export function EngagementWidget() {
  const { data: recentEvents, isLoading } = trpc.engagement.getRecent.useQuery(undefined);

  const iconMap: Record<string, any> = {
    'Birthday': Cake,
    'Anniversary': Gift,
    'New Hire': UserPlus,
  };
  const colorMap: Record<string, string> = {
    'Birthday': 'text-pink-400',
    'Anniversary': 'text-yellow-400',
    'New Hire': 'text-[var(--verify-green)]',
  };

  const events = recentEvents || [];

  return (
    <div className={`${BENTO_CLASSES} h-full p-6 flex flex-col`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <HeartPulse size={16} className="text-pink-500" /> Recent Activity
        </h3>
      </div>

      <div className="space-y-4 flex-1">
        {isLoading ? (
          <div className="text-center text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest animate-pulse py-4">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest py-4">No recent activity</div>
        ) : (
          events.map((event: any, i: number) => {
            const EventIcon = iconMap[event.type] || UserPlus;
            const color = colorMap[event.type] || 'text-[var(--verify-green)]';
            return (
              <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                    <EventIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{event.name}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] uppercase">{event.type}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-white/50">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- LEGACY EXPORTS ---
export function RadarWidget({ data }: { data: any[] }) {
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col relative overflow-hidden min-h-[320px] p-6 group`}>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ledger-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0" />
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <BrainCircuit size={16} className="text-purple-400" /> Culture Pulse
        </h3>
      </div>
      <div className="flex-1 w-full relative z-10 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }} />
            <Radar name="Score" dataKey="A" stroke="var(--ledger-blue)" strokeWidth={2} fill="var(--ledger-blue)" fillOpacity={0.3} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
