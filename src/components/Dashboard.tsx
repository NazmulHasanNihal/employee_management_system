"use client";

import React from 'react';
import { Activity, Sparkles, Users, Clock, Calendar, DollarSign } from 'lucide-react';
import { StatCard, LiveClockWidget, RadarWidget, QuickActionsWidget, EngagementWidget } from './dashboard/BentoWidgets';
import { Broadcasts } from './dashboard/Broadcasts';
import { trpc } from '@/lib/trpc/client';

export default function Dashboard() {
  // Bypassing auth for local dev
  const user = {
    id: "cmri3jxi700041mmgjct8xyss",
    name: "Nazmul Admin",
    email: "nazmulhas36@gmail.com",
    role: "Admin",
    department: "Executive",
    designation: "CEO"
  };
  
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const telemetry = stats || { headcount: 0, pendingApps: 0, activeToday: '0%', totalPayroll: 0 };
  
  const radarData = [
    { subject: 'Retention', A: 85, fullMark: 100 },
    { subject: 'Satisfaction', A: 92, fullMark: 100 },
    { subject: 'Performance', A: 78, fullMark: 100 },
    { subject: 'Compensation', A: 88, fullMark: 100 },
    { subject: 'Diversity', A: 75, fullMark: 100 },
  ];

  if (!user) {
    return null; // Will redirect via layout
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-0 max-w-[1600px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <Activity className="text-[var(--ledger-blue)]" size={36} />
            {user.role === 'Admin' ? 'System Telemetry' : 'Command Center'}
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            {user.role === 'Admin' ? 'Live Organization Overview & Analytics' : `${user.designation} • ${user.department}`}
          </p>
        </div>
      </div>

      {/* BENTO BOX GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[160px]">
        
        {/* ROW 1 */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <LiveClockWidget />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard 
            title="Total Headcount" 
            value={telemetry.headcount} 
            icon={Users} 
            colorClass="text-[var(--verify-green)]" 
            gradientFrom="from-[var(--verify-green)]/20" 
          />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard 
            title="Attendance Rate" 
            value={telemetry.activeToday} 
            icon={Clock} 
            colorClass="text-[var(--ledger-blue)]" 
            gradientFrom="from-[var(--ledger-blue)]/20" 
          />
        </div>

        {/* ROW 2 */}
        <div className="col-span-1 row-span-1">
          <StatCard 
            title="Pending Leaves" 
            value={telemetry.pendingApps} 
            icon={Calendar} 
            colorClass="text-[var(--signal-amber)]" 
            gradientFrom="from-[var(--signal-amber)]/20" 
          />
        </div>
        <div className="col-span-1 row-span-1">
          <StatCard 
            title="Payroll (MTD)" 
            value={`$${telemetry.totalPayroll.toLocaleString()}`} 
            icon={DollarSign} 
            colorClass="text-purple-400" 
            gradientFrom="from-purple-500/20" 
          />
        </div>

        {/* ROW 3 & 4 */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <RadarWidget data={radarData} />
        </div>
        <div className="col-span-1 md:col-span-2 row-span-2">
          <QuickActionsWidget />
        </div>

        {/* ROW 5 */}
        <div className="col-span-1 md:col-span-2 row-span-2">
          <EngagementWidget />
        </div>
        <div className="col-span-1 md:col-span-2 row-span-2 h-full">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col hover:border-white/20 transition-all duration-500">
             <Broadcasts announcements={[]} isLoading={false} />
          </div>
        </div>

      </div>
    </div>
  );
}
