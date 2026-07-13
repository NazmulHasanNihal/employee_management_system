"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Calendar, DollarSign, BrainCircuit, 
  UserPlus, Target, Clock, Zap, Cake, Gift, HeartPulse, MoreHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, Tooltip 
} from 'recharts';

const BENTO_CLASSES = "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]";

// --- 1. STAT CARD ---
export function StatCard({ title, value, icon: Icon, colorClass, gradientFrom }: any) {
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
        <h4 className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest mb-2">{title}</h4>
        <p className="text-3xl lg:text-4xl font-mono font-black text-white">{value}</p>
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
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--ledger-blue)]/10 to-transparent blur-3xl rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
      
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

// --- 3. RADAR CHART ---
export function RadarWidget({ data }: { data: any[] }) {
  return (
    <div className={`${BENTO_CLASSES} h-full flex flex-col relative overflow-hidden min-h-[320px] p-6 group`}>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ledger-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0" />
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <BrainCircuit size={16} className="text-purple-400" /> Culture Pulse
        </h3>
        <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded">Live AI</span>
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

// --- 4. QUICK ACTIONS COMMAND CENTER ---
export function QuickActionsWidget() {
  const actions = [
    { name: 'Add Member', icon: UserPlus, color: 'text-[var(--verify-green)]', bg: 'hover:bg-[var(--verify-green)]/10', border: 'hover:border-[var(--verify-green)]/30' },
    { name: 'Run Payroll', icon: Target, color: 'text-purple-400', bg: 'hover:bg-purple-500/10', border: 'hover:border-purple-500/30' },
    { name: 'Approve Leaves', icon: Calendar, color: 'text-[var(--signal-amber)]', bg: 'hover:bg-[var(--signal-amber)]/10', border: 'hover:border-[var(--signal-amber)]/30' },
    { name: 'Broadcast', icon: Zap, color: 'text-[var(--ledger-blue)]', bg: 'hover:bg-[var(--ledger-blue)]/10', border: 'hover:border-[var(--ledger-blue)]/30' },
  ];

  return (
    <div className={`${BENTO_CLASSES} h-full p-6 flex flex-col`}>
      <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
        <Activity size={16} className="text-orange-400" /> Command Center
      </h3>
      
      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((action, i) => (
          <button 
            key={i} 
            className={`flex flex-col items-center justify-center p-4 bg-black/40 border border-white/5 rounded-2xl transition-all duration-300 group ${action.bg} ${action.border}`}
          >
            <action.icon size={24} className={`${action.color} mb-3 group-hover:scale-110 transition-transform`} />
            <span className="text-xs font-mono font-bold text-white/70 group-hover:text-white">{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 5. ENGAGEMENT / EVENTS ---
export function EngagementWidget() {
  const events = [
    { name: 'Sarah Connor', type: 'Birthday', icon: Cake, color: 'text-pink-400', date: 'Today' },
    { name: 'John Smith', type: '5 Yrs Anniversary', icon: Gift, color: 'text-yellow-400', date: 'Tomorrow' },
    { name: 'Elena Rogers', type: 'New Hire', icon: UserPlus, color: 'text-[var(--verify-green)]', date: 'Oct 15' },
  ];

  return (
    <div className={`${BENTO_CLASSES} h-full p-6 flex flex-col`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <HeartPulse size={16} className="text-pink-500" /> Engagement
        </h3>
        <button className="text-xs font-mono text-[var(--ledger-blue)] hover:text-white transition-colors">View All</button>
      </div>

      <div className="space-y-4 flex-1">
        {events.map((event, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors border border-transparent hover:border-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5 ${event.color}`}>
                <event.icon size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{event.name}</p>
                <p className="text-xs font-mono text-[var(--text-muted)] uppercase">{event.type}</p>
              </div>
            </div>
            <span className="text-xs font-mono text-white/50">{event.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
