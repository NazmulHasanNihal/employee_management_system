"use client";

import React from 'react';
import { Calendar } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { LeaveLog } from '@/components/leave/LeaveLog';

export default function LeavePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const { data: requests, isLoading } = trpc.leave.getRequests.useQuery(undefined, { enabled: !!user });
  
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  if (!user || isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono text-[10px]">Loading Calendar...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-[var(--verify-green)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Calendar className="text-[var(--ledger-blue)]" size={28} /> Leave Management
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            PTO, Availability & Calendar Sync
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-auto custom-scrollbar pr-2">
        <div className="lg:col-span-2 space-y-6">
          <LeaveLog requests={requests || []} isAdmin={isAdmin} currentUser={user} />
        </div>

        <div className="lg:col-span-1">
          <LeaveRequestForm />
        </div>
      </div>
    </div>
  );
}
