"use client";

import React from 'react';
import { ShieldCheck, CreditCard } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;

  if (!user) return null;

  // Protect route
  if (user.role !== 'Admin') {
    redirect('/');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text">System Configuration</h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">tRPC Policies & Pay Structures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ledger-panel p-6 flex flex-col">
          <h3 className="font-mono text-xs font-bold text-[var(--signal-amber)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={16} /> tRPC Permission Matrix
          </h3>
          <div className="overflow-x-auto border ledger-border">
            <table className="w-full text-left border-collapse font-mono text-[9px]">
              <thead className="bg-[var(--bg-void)] border-b ledger-border ledger-muted uppercase tracking-widest">
                <tr>
                  <th className="p-2">Resource</th>
                  <th className="p-2 text-center">L4 Admin</th>
                  <th className="p-2 text-center">L3 HR</th>
                  <th className="p-2 text-center">L1 Emp</th>
                </tr>
              </thead>
              <tbody className="divide-y ledger-border ledger-text">
                {[
                  { m: 'PAYROLL', a: 'R/W/D', hr: 'R/W', e: 'R (Self)' },
                  { m: 'ATTENDANCE', a: 'R/W/D', hr: 'R/W', e: 'R/W (Self)' },
                  { m: 'LEAVE', a: 'R/W', hr: 'R/W', e: 'None' },
                  { m: 'AUDIT', a: 'R (Immutable)', hr: 'None', e: 'None' }
                ].map((row, i) => (
                  <tr key={i} className="table-row">
                    <td className="p-2 font-bold">{row.m}</td>
                    <td className="p-2 text-center text-[var(--alert-red)]">{row.a}</td>
                    <td className="p-2 text-center text-[var(--signal-amber)]">{row.hr}</td>
                    <td className="p-2 text-center text-[var(--verify-green)]">{row.e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ledger-panel p-6">
           <h3 className="font-mono text-xs font-bold text-[var(--ledger-blue)] uppercase tracking-widest mb-4 flex items-center gap-2">
             <CreditCard size={16} /> Salary Structure Builder
           </h3>
           <div className="space-y-2 font-mono text-xs">
             <div className="flex justify-between items-center p-2 bg-[var(--bg-void)] border ledger-border">
               <span>Basic Salary</span>
               <span className="ledger-muted">60% of Gross</span>
             </div>
             <div className="flex justify-between items-center p-2 bg-[var(--bg-void)] border ledger-border">
               <span>House Rent</span>
               <span className="ledger-muted">20% of Gross</span>
             </div>
             <div className="flex justify-between items-center p-2 bg-[var(--bg-void)] border ledger-border">
               <span>Provident Fund</span>
               <span className="text-[var(--alert-red)]">-10% of Basic</span>
             </div>
             <button className="text-[var(--signal-amber)] w-full text-center p-2 border border-dashed border-[var(--signal-amber)]/30 hover:bg-[var(--signal-amber)]/10 transition-colors">
               + Add Component
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
