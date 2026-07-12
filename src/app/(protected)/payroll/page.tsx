"use client";

import React, { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import { RunPayrollForm } from '@/components/payroll/RunPayrollForm';
import { PayslipCard } from '@/components/payroll/PayslipCard';
import { Button } from '@/components/ui/button';

export default function PayrollPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const utils = trpc.useUtils();
  const { data: payrolls, isLoading } = trpc.payroll.getPayrolls.useQuery();

  const [showGenerate, setShowGenerate] = useState(false);

  if (isLoading) return <div className="p-8 text-center text-white/50 animate-pulse font-mono">Loading Payroll Data...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--verify-green)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <DollarSign className="text-[var(--verify-green)]" size={28} /> Payroll
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            Compensation & Payslips
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowGenerate(!showGenerate)}
            variant="outline"
            className="bg-white/5 border-white/10 text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 rounded-lg backdrop-blur-sm"
          >
            <Plus size={14} /> {showGenerate ? 'Cancel' : 'Run Payroll'}
          </Button>
        )}
      </div>

      {showGenerate && isAdmin && (
        <RunPayrollForm onSuccess={() => setShowGenerate(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-auto custom-scrollbar pr-2">
        {payrolls?.map((pay: any) => (
          <PayslipCard key={pay.id} pay={pay} isAdmin={isAdmin} currentUser={user} />
        ))}
        {(!payrolls || payrolls.length === 0) && (
          <div className="col-span-full py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl">
            No payroll records found.
          </div>
        )}
      </div>
    </div>
  );
}
