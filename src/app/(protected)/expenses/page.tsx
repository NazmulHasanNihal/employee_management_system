"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { Receipt, Check, X, FileText } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border shrink-0">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text flex items-center gap-2">
            <Receipt size={24} className="text-[var(--ledger-blue)]" /> Expense Management
          </h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            {isAdmin ? 'Reimbursement Approval Queue' : 'My Expense Claims'}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-[var(--ledger-blue)] text-black px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors">
            {showForm ? 'Cancel' : 'Submit Claim'}
          </button>
        )}
      </div>

      {showForm && !isAdmin && (
        <div className="ledger-panel p-4 bg-[var(--bg-panel)]">
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); submitExpense.mutate(newExpense); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">Amount ($)</label>
                <input 
                  type="number" step="0.01" min="0.01" required
                  value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">Category</label>
                <select 
                  value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]"
                >
                  <option value="TRAVEL">Travel</option>
                  <option value="MEALS">Meals</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isMileage" checked={newExpense.isMileage} onChange={e => setNewExpense({...newExpense, isMileage: e.target.checked})} />
              <label htmlFor="isMileage" className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Auto-calculate Mileage ($0.65/mile)</label>
            </div>
            
            {newExpense.isMileage && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">Distance (Miles)</label>
                <input 
                  type="number" step="0.1" min="0.1" required={newExpense.isMileage}
                  value={newExpense.distance || ''} onChange={e => setNewExpense({...newExpense, distance: parseFloat(e.target.value)})}
                  className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]"
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">Description</label>
              <textarea 
                required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)] h-20 resize-none"
              ></textarea>
            </div>
            <button disabled={submitExpense.isPending} type="submit" className="bg-[var(--ledger-blue)] text-black px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors">
              Submit Expense
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar">
        {(isLoading || myLoading) ? (
          <div className="p-8 text-center ledger-muted animate-pulse">Loading Expenses...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-panel)]">
                <th className="p-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">Date</th>
                {isAdmin && <th className="p-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">Employee</th>}
                <th className="p-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">Details</th>
                <th className="p-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Amount</th>
                <th className="p-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Status</th>
                {isAdmin && <th className="p-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {data?.map((expense: any) => (
                <tr key={expense.id} className="border-b border-[var(--border-hairline)] hover:bg-[var(--bg-panel)] transition-colors group">
                  <td className="p-3 text-xs font-mono text-[var(--text-muted)]">{new Date(expense.createdAt).toLocaleDateString()}</td>
                  {isAdmin && <td className="p-3 text-xs font-mono">{expense.user?.name}</td>}
                  <td className="p-3">
                    <p className="text-xs font-bold">{expense.category} {expense.isMileage && `(Mileage: ${expense.distance} mi)`}</p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-xs">{expense.description}</p>
                  </td>
                  <td className="p-3 text-xs font-mono text-right font-bold text-[var(--ledger-blue)]">${expense.amount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-[9px] font-mono uppercase font-bold border ${expense.status === 'APPROVED' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]' : expense.status === 'REJECTED' ? 'bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]' : expense.status === 'PENDING_EXECUTIVE' ? 'bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]' : 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]'}`}>
                      {expense.status.replace('_', ' ')}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-3 text-right space-x-2">
                      {(expense.status === 'PENDING' || expense.status === 'PENDING_EXECUTIVE') && (
                        <>
                          <button onClick={() => updateStatus.mutate({ expenseId: expense.id, status: 'APPROVED' })} className="p-1 hover:bg-[var(--verify-green)]/20 text-[var(--verify-green)] rounded transition-colors" title="Approve"><Check size={16} /></button>
                          <button onClick={() => updateStatus.mutate({ expenseId: expense.id, status: 'REJECTED' })} className="p-1 hover:bg-[var(--alert-red)]/20 text-[var(--alert-red)] rounded transition-colors" title="Reject"><X size={16} /></button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">NO EXPENSE RECORDS FOUND</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
