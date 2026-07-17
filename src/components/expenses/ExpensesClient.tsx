'use client';

import React, { useState } from 'react';
import { Receipt, CheckCircle2, XCircle, Plus, Landmark, DollarSign, AlertTriangle, Ban } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/format';

interface ExpensesClientProps {
  initialExpenses: any[];
  initialPenalties: any[];
  isAdmin: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: 'Travel / Transit',
  MEALS: 'Meals & Entertainment',
  EQUIPMENT: 'IT / Equipment',
  OTHER: 'Other Expense',
};

export function ExpensesClient({ initialExpenses, initialPenalties, isAdmin }: ExpensesClientProps) {
  const { user } = useUser();
  const [expenses, setExpenses] = useState<any[]>(initialExpenses || []);
  const [penalties, setPenalties] = useState<any[]>(initialPenalties || []);
  const utils = trpc.useUtils();

  const submitExpense = trpc.expenses.createExpense.useMutation({
    onSuccess: () => {
      utils.expenses.getAll.invalidate();
      utils.expenses.getMyExpenses.invalidate();
      setNewExpense({ amount: 0, category: 'TRAVEL', description: '', isMileage: false, distance: 0 });
      setShowForm(false);
    },
  });

  const updateStatus = trpc.expenses.updateStatus.useMutation({
    onSuccess: () => {
      utils.expenses.getAll.invalidate();
      utils.expenses.getMyExpenses.invalidate();
    },
  });

  const createPenalty = trpc.expenses.createPenalty.useMutation({
    onSuccess: () => { utils.invalidate('expenses'); utils.invalidate('penalties'); setPenaltyDraft({ userId: '', amount: 0, reason: '', dueDate: '' }); },
  });
  const updatePenaltyStatus = trpc.expenses.updatePenaltyStatus.useMutation({
    onSuccess: () => { utils.invalidate('expenses'); utils.invalidate('penalties'); },
  });

  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: 'TRAVEL',
    description: '',
    isMileage: false,
    distance: 0,
  });
  const [penaltyDraft, setPenaltyDraft] = useState({ userId: '', amount: 0, reason: '', dueDate: '' });
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);

  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin && showPenaltyForm });

  const data = expenses;

  const totalPending =
    data?.filter((d: any) => d.status === 'PENDING').reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const totalApproved =
    data?.filter((d: any) => d.status === 'APPROVED').reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitExpense.mutate(newExpense);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Pending</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-main)]">
              {formatCurrency(totalPending, 'BDT', 'en')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Reimbursed</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-main)]">
              {formatCurrency(totalApproved, 'BDT', 'en')}
            </p>
          </CardContent>
        </Card>
      </div>

      {!isAdmin && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel Claim' : <><Plus className="h-4 w-4" /> New Claim</>}
          </Button>
        </div>
      )}

      {/* Penalties — employees see their own; admins manage */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-[var(--rose)]" /> My Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {penalties.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">You have no outstanding penalties. 🎉</p>
            ) : (
              <div className="space-y-3">
                {penalties.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rose-soft)] text-[var(--rose)]">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">{formatCurrency(p.amount, 'BDT', 'en')}</p>
                        <p className="text-xs text-[var(--text-muted)]">{p.reason}</p>
                        {p.dueDate && <p className="text-[10px] text-[var(--text-muted)]">Due: {new Date(p.dueDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <StatusBadge status={p.status === 'PAID' ? 'APPROVED' : 'PENDING'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowPenaltyForm((s) => !s)}>
              {showPenaltyForm ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Penalty</>}
            </Button>
          </div>
          {showPenaltyForm && (
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Ban className="h-4 w-4 text-[var(--rose)]" /> Issue Penalty</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); if (penaltyDraft.userId && penaltyDraft.amount && penaltyDraft.reason) createPenalty.mutate({ ...penaltyDraft, amount: Number(penaltyDraft.amount), dueDate: penaltyDraft.dueDate || undefined }); }}>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Employee</label>
                    <select required className="ledger-input w-full cursor-pointer rounded-lg px-3 py-2.5 text-sm" value={penaltyDraft.userId} onChange={(e) => setPenaltyDraft({ ...penaltyDraft, userId: e.target.value })}>
                      <option value="">-- Select --</option>
                      {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Amount (৳)</label>
                    <Input type="number" required value={penaltyDraft.amount || ''} onChange={(e) => setPenaltyDraft({ ...penaltyDraft, amount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Due Date</label>
                    <Input type="date" value={penaltyDraft.dueDate} onChange={(e) => setPenaltyDraft({ ...penaltyDraft, dueDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Reason</label>
                    <Input required value={penaltyDraft.reason} onChange={(e) => setPenaltyDraft({ ...penaltyDraft, reason: e.target.value })} placeholder="Reason for penalty" />
                  </div>
                  <div className="md:col-span-4">
                    <Button type="submit" disabled={createPenalty.isPending} className="bg-[var(--rose)] hover:brightness-105">Issue Penalty</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ban className="h-4 w-4 text-[var(--rose)]" /> All Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              {penalties.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-muted)]">No penalties recorded.</p>
              ) : (
                <div className="divide-y divide-[var(--border-hairline)]">
                  {penalties.map((p: any) => (
                    <div key={p.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">{formatCurrency(p.amount, 'BDT', 'en')} — {p.user?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{p.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status === 'PAID' ? 'APPROVED' : 'PENDING'} />
                        {p.status !== 'PAID' && (
                          <Button variant="outline" size="sm" onClick={() => updatePenaltyStatus.mutate({ id: p.id, status: 'PAID' })}>Mark Paid</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {showForm && !isAdmin && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[var(--brand-strong)]" /> File Expense Claim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Claim Amount (৳)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="pl-9"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Category</label>
                  <select
                    className="ledger-input"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-hover)] p-3">
                <input
                  type="checkbox"
                  id="isMileage"
                  checked={newExpense.isMileage}
                  onChange={(e) => setNewExpense({ ...newExpense, isMileage: e.target.checked })}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                <label htmlFor="isMileage" className="cursor-pointer text-xs text-[var(--text-main)]">
                  Auto-calculate Mileage (distance-based)
                </label>
              </div>

              {newExpense.isMileage && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Distance Driven (Miles)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required={newExpense.isMileage}
                    value={newExpense.distance || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, distance: parseFloat(e.target.value) })}
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                  Business Justification / Description
                </label>
                <textarea
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Please describe the business purpose of this expense..."
                  className="ledger-input h-24 resize-none"
                />
              </div>

              <Button type="submit" disabled={submitExpense.isPending}>
                Submit Ticket For Approval
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[var(--text-muted)]" /> Expense Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!data || data.length === 0) ? (
            <EmptyState
              title="No Expense Records Found"
              description="There are no active reimbursement claims in this ledger."
              actionText={!isAdmin ? 'New Claim' : undefined}
              onAction={!isAdmin ? () => setShowForm(true) : undefined}
            />
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {data.map((exp: any) => (
                <div
                  key={exp.id}
                  className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-[var(--text-main)]">
                          {formatCurrency(exp.amount, 'BDT', 'en')}
                        </h4>
                        <StatusBadge status={exp.status} />
                        <Badge variant="secondary">{exp.category}</Badge>
                      </div>
                      <p className="mt-1 text-sm italic text-[var(--text-muted)]">"{exp.description}"</p>
                      {isAdmin && (
                        <p className="mt-1 text-xs text-[var(--brand-strong)]">Claimant: {exp.user?.name}</p>
                      )}
                    </div>
                  </div>

                  {isAdmin && exp.status === 'PENDING' && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[var(--emerald)]"
                        onClick={() => updateStatus.mutate({ id: exp.id, status: 'APPROVED' })}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: exp.id, status: 'REJECTED' })}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
