"use client";

import React from 'react';
import { Clock } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import { ClockInWidget } from '@/components/attendance/ClockInWidget';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';

export default function AttendancePage() {
  const { data: session } = authClient.useSession();
  const { data: logs, isLoading: loadingLogs } = trpc.attendance.getLogs.useQuery({});

  const isAdmin = (session?.user as any)?.role === 'Admin';

  if (loadingLogs) return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono">Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-[var(--alert-red)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Clock className="text-[var(--ledger-blue)]" size={28} /> Time & Attendance
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            Geolocation Clock-In Terminal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-auto custom-scrollbar pr-2">
        <div className="lg:col-span-1 space-y-6 h-fit sticky top-0">
          <ClockInWidget />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <AttendanceTable logs={logs || []} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
