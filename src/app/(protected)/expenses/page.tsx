"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { Receipt, CheckCircle2, XCircle, FileText, Plus, Landmark, HandCoins, Activity, DollarSign } from 'lucide-react';

export default function ExpensesPage() {
  const { data: session } = authClient.useSession();
  const utils = trpc.useUtils();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'HR Manager' || userRole === 'Manager';
  
  const { data: expenses, isLoading } = trpc.expenses.getAll.useQuery(undefined, { enabled: isAdmin });
  const { data: myExpenses, isLoading: myLoading } = trpc.expenses.getMyExpenses.useQuery(undefined, { enabled: !isAdmin });
  
  const submitExpense = trpc.expenses.submit.useMutation({
    onSuccess: () => {
      utils.expenses.getMyExpenses.invalidate();
      setNewExpense({ amount: 0, category: 'TRAVEL', description: '', isMileage: false, distance: 0 });
      setShowForm(false);
    }
  });

  const updateStatus = trpc.expenses.updateStatus.useMutation({
    onSuccess: () => utils.expenses.getAll.invalidate()
  });

  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: 0, category: 'TRAVEL', description: '', isMileage: false, distance: 0 });

  const data = isAdmin ? expenses : myExpenses;

  if (isLoading || myLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Accessing Financial Records...</div>;
  }

  // Calculate totals
  const totalPending = data?.filter((d: any) => d.status === 'PENDING').reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const totalApproved = data?.filter((d: any) => d.status === 'APPROVED').reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-[var(--ledger-blue)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Receipt className="text-purple-400" size={36} />
            Expenses Hub
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            {isAdmin ? 'Corporate Reimbursement Approvals.' : 'My Expense & Reimbursement Claims.'}
          </p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="mt-6 md:mt-0 bg-purple-500 text-white px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2"
          >
            {showForm ? 'Cancel Claim' : <><Plus size={16} /> New Claim</>}
          </button>
        )}
      </div>

      {/* Financial Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-[var(--signal-amber)]/20 hover:border-[var(--signal-amber)]/50 transition-colors rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--signal-amber)]/5 to-transparent pointer-events-none" />
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity size={14} className="text-[var(--signal-amber)]" /> Total Pending
          </h4>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-mono font-black text-white">${totalPending.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-[var(--verify-green)]/20 hover:border-[var(--verify-green)]/50 transition-colors rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/5 to-transparent pointer-events-none" />
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <HandCoins size={14} className="text-[var(--verify-green)]" /> Total Reimbursed
          </h4>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-mono font-black text-white">${totalApproved.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* New Claim Form */}
      {showForm && !isAdmin && (
        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 relative shadow-2xl animate-in slide-in-from-top-4 z-20">
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Receipt size={14} className="text-purple-400" /> File Expense Claim
          </h4>
          <form className="space-y-6" onSubmit={e => { e.preventDefault(); submitExpense.mutate(newExpense); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Claim Amount ($)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input 
                    type="number" step="0.01" min="0.01" required
                    value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Category</label>
                <select 
                  value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-purple-500 outline-none transition-colors appearance-none"
                >
                  <option value="TRAVEL">Travel / Transit</option>
                  <option value="MEALS">Meals & Entertainment</option>
                  <option value="EQUIPMENT">IT / Equipment</option>
                  <option value="OTHER">Other Expense</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-black/30 p-4 rounded-xl border border-white/5">
              <input type="checkbox" id="isMileage" checked={newExpense.isMileage} onChange={e => setNewExpense({...newExpense, isMileage: e.target.checked})} className="accent-purple-500 w-4 h-4" />
              <label htmlFor="isMileage" className="text-xs font-mono uppercase tracking-widest text-white cursor-pointer select-none">Auto-calculate Mileage ($0.65/mile)</label>
            </div>
            
            {newExpense.isMileage && (
              <div className="animate-in fade-in">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Distance Driven (Miles)</label>
                <input 
                  type="number" step="0.1" min="0.1" required={newExpense.isMileage}
                  value={newExpense.distance || ''} onChange={e => setNewExpense({...newExpense, distance: parseFloat(e.target.value)})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Business Justification / Description</label>
              <textarea 
                required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Please describe the business purpose of this expense..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-colors h-24 resize-none custom-scrollbar"
              ></textarea>
            </div>

            <button disabled={submitExpense.isPending} type="submit" className="w-full bg-purple-500 text-white px-6 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50">
              Submit Ticket For Approval
            </button>
          </form>
        </div>
      )}

      {/* Expenses Table/List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-black/40 border-b border-white/10 p-6">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
            <Landmark size={16} className="text-[var(--text-muted)]" /> Expense Ledger
          </h3>
        </div>
        
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
          {(!data || data.length === 0) ? (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest bg-black/20">
              No expense records found.
            </div>
          ) : (
            data.map((exp: any) => (
              <div key={exp.id} className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    exp.category === 'TRAVEL' ? 'bg-[var(--ledger-blue)]/10 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/30' :
                    exp.category === 'MEALS' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                    exp.category === 'EQUIPMENT' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                    'bg-white/10 text-white border-white/30'
                  }`}>
                    <Receipt size={24} />
                  </div>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold text-white font-mono">${exp.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                      <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        exp.status === 'APPROVED' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30 shadow-[0_0_10px_rgba(0,255,100,0.2)]' :
                        exp.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(255,0,0,0.2)]' :
                        'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30 shadow-[0_0_10px_var(--signal-amber)] animate-pulse'
                      }`}>
                        {exp.status}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest bg-white/10 text-white px-2 py-0.5 rounded-full">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] font-sans italic mt-2">"{exp.description}"</p>
                    {isAdmin && (
                      <p className="text-[10px] font-mono text-[var(--ledger-blue)] uppercase mt-2 font-bold">Claimant: {exp.user?.name}</p>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && exp.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => updateStatus.mutate({ id: exp.id, status: 'APPROVED' })}
                      className="bg-[var(--verify-green)]/20 text-[var(--verify-green)] border border-[var(--verify-green)]/30 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)] hover:text-black transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => updateStatus.mutate({ id: exp.id, status: 'REJECTED' })}
                      className="bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
