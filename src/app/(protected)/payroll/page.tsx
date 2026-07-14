"use client";

import React, { useState } from 'react';
import { DollarSign, Plus, Download, ChevronRight, Calculator, CheckCircle2, History } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import { RunPayrollForm } from '@/components/payroll/RunPayrollForm';

export default function PayrollPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const utils = trpc.useUtils();
  const { data: payrolls, isLoading } = trpc.payroll.getPayrolls.useQuery();

  const [showGenerate, setShowGenerate] = useState(false);

  if (isLoading || !user) return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono text-xs uppercase tracking-widest">Processing Financials...</div>;

  const downloadCSV = () => {
    if (!payrolls || payrolls.length === 0) return;
    
    // Headers
    let csvStr = "ID,Month,Year,Status,Total Amount,Employee Name,Employee Email\n";
    
    // Rows
    payrolls.forEach((pay: any) => {
      const row = [
        pay.id,
        pay.month,
        pay.year,
        pay.status,
        pay.totalAmount,
        pay.user?.name || "N/A",
        pay.user?.email || "N/A"
      ].map(val => `"${val}"`).join(",");
      csvStr += row + "\n";
    });

    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_export_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--verify-green)]/10 to-[var(--ledger-blue)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <DollarSign className="text-[var(--verify-green)]" size={36} />
            Payroll
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Compensation, Distributions & Payslips.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-4 mt-6 md:mt-0">
            <button 
              onClick={downloadCSV}
              className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button 
              onClick={() => setShowGenerate(!showGenerate)}
              className="bg-[var(--verify-green)] text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,100,0.3)] transition-all flex items-center gap-2"
            >
              {showGenerate ? <ChevronRight size={16} /> : <Calculator size={16} />}
              {showGenerate ? 'Cancel Operation' : 'Run Payroll'}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/5 to-transparent pointer-events-none" />
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <DollarSign size={14} className="text-[var(--verify-green)]" /> Total Payroll YTD
            </h4>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-4xl font-mono font-black text-white">$425,000</span>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-2">Across 125 Employees</p>
          </div>
          <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ledger-blue)]/5 to-transparent pointer-events-none" />
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <History size={14} className="text-[var(--ledger-blue)]" /> Last Run
            </h4>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-4xl font-mono font-black text-white">July 2026</span>
            </div>
            <p className="text-[10px] font-mono text-[var(--verify-green)] uppercase tracking-widest mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Processed Successfully</p>
          </div>
        </div>
      )}

      {showGenerate && isAdmin && (
        <div className="animate-in slide-in-from-top-4">
          <RunPayrollForm onSuccess={() => setShowGenerate(false)} />
        </div>
      )}

      <div className="space-y-6">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-[var(--text-muted)]" /> Payslip Vault
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payrolls?.map((pay: any) => (
            <div key={pay.id} className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[var(--ledger-blue)]/50 rounded-3xl p-6 relative overflow-hidden group transition-all">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-bold text-white font-mono">{pay.month} {pay.year}</h4>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Salary Distribution</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--verify-green)]/10 text-[var(--verify-green)] flex items-center justify-center border border-[var(--verify-green)]/30">
                  <DollarSign size={20} />
                </div>
              </div>

              {isAdmin && (
                <div className="mb-6 bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-white font-bold truncate">{pay.user?.name}</p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest truncate">{pay.user?.email}</p>
                </div>
              )}

              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Net Pay</p>
                  <span className="text-2xl font-black font-mono text-white">${pay.totalAmount?.toLocaleString()}</span>
                </div>
                <span className="px-2 py-1 bg-[var(--verify-green)]/10 text-[var(--verify-green)] border border-[var(--verify-green)]/30 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest">
                  {pay.status}
                </span>
              </div>

              <button className="w-full bg-[var(--ledger-blue)]/20 hover:bg-[var(--ledger-blue)]/40 text-[var(--ledger-blue)] border border-[var(--ledger-blue)]/30 py-3 rounded-xl flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest transition-all">
                <Download size={14} /> Download PDF
              </button>
            </div>
          ))}
          
          {(!payrolls || payrolls.length === 0) && (
            <div className="col-span-full py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-3xl bg-black/20 uppercase tracking-widest">
              No Payslips Found in Vault.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
