'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { calculateNewSalaryFromPercentage, calculateNewSalaryFromAmount, calculateNewSalaryFromTarget, type SalaryChangeResult } from '@/lib/compensation';
import { HierarchicalEmployeeSelect } from './HierarchicalEmployeeSelect';
import { T } from '@/components/Translate';

interface Props {
  onSuccess: () => void;
  initialUserId?: string;
}

const ADJUSTMENT_TYPES = [
  { value: 'INCREMENT', label: 'Increment' },
  { value: 'DECREMENT', label: 'Decrement' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
];

const REASONS = [
  'Annual Review',
  'Performance Bonus',
  'Promotion',
  'Role Change',
  'Market Correction',
  'Cost of Living',
  'Merit Increase',
  'Demotion',
  'Correction',
  'Other',
];

export function CreateAdjustmentForm({ onSuccess, initialUserId }: Props) {
  const utils = trpc.useUtils();
  const [userId, setUserId] = useState(initialUserId || '');
  const [selectedType, setSelectedType] = useState('INCREMENT');
  const [method, setMethod] = useState<'percentage' | 'amount' | 'target'>('percentage');
  const [percentage, setPercentage] = useState('');
  const [amount, setAmount] = useState('');
  const [targetSalary, setTargetSalary] = useState('');
  const [reason, setReason] = useState('Annual Review');
  const [customReason, setCustomReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoImplement, setAutoImplement] = useState(true);

  const { data: employees = [] } = trpc.registry.searchEmployees.useQuery({ query: '' });

  const createMutation = trpc.compensation.createAdjustment.useMutation({
    onSuccess: (result: any) => {
      if (result?.offline) {
        toast.success('Queued', 'Adjustment queued for sync (offline).');
      } else if (autoImplement) {
        toast.success('Salary Updated', 'Adjustment implemented immediately and base salary updated.');
      } else {
        toast.success('Adjustment Created', 'Compensation adjustment recorded and pending approval.');
      }
      utils.compensation.getAdjustments.invalidate();
      utils.invalidate('registry');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err?.message || 'Could not create the adjustment.');
    },
  });

  const empList = Array.isArray(employees) ? employees : [];
  const selectedEmp = userId ? empList.find((e: any) => e.id === userId) || null : null;
  const currentSalary = selectedEmp?.baseSalary ?? 0;

  const computeResult = (): SalaryChangeResult | null => {
    if (!userId || !selectedEmp) return null;
    const old = Number(currentSalary) || 0;

    if (method === 'percentage') {
      const pct = Number(percentage);
      if (isNaN(pct) || percentage === '') return null;
      return calculateNewSalaryFromPercentage(old, pct);
    }
    if (method === 'amount') {
      const amt = Number(amount);
      if (isNaN(amt) || amount === '') return null;
      return calculateNewSalaryFromAmount(old, amt);
    }
    const tgt = Number(targetSalary);
    if (isNaN(tgt) || targetSalary === '') return null;
    return calculateNewSalaryFromTarget(old, tgt);
  };

  const result = computeResult();
  const displayedNewSalary = result?.newSalary ?? 0;
  const displayedDelta = result?.delta ?? 0;
  const displayedPct = result?.percentage ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedEmp) {
      toast.error('Missing Employee', 'Please select an employee.');
      return;
    }
    if (!result) {
      toast.error('Calculation Error', 'Please provide a valid adjustment value.');
      return;
    }
    if (oldSalaryEqualNew(result)) {
      toast.error('No Change', 'New salary must differ from current salary.');
      return;
    }

    const finalReason = reason === 'Other' ? (customReason || 'Other') : reason;

    createMutation.mutate({
      userId,
      type: selectedType,
      oldSalary: result.oldSalary,
      newSalary: result.newSalary,
      reason: finalReason,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      notes: notes || undefined,
      autoImplement,
    });
  };

  function oldSalaryEqualNew(r: SalaryChangeResult): boolean {
    return r.oldSalary === r.newSalary;
  }

  return (
    <Card className="bg-[var(--bg-panel)] border border-[var(--brand)]/30 shadow-2xl animate-in slide-in-from-top-4 mb-6 rounded-3xl">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <h3 className="text-base font-bold uppercase tracking-wide text-[var(--text-main)]">
            {/* @ts-ignore */}<T>Create Compensation Adjustment</T>
          </h3>
          <Button variant="ghost" size="sm" onClick={onSuccess}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Employee</T>
              </Label>
              <HierarchicalEmployeeSelect
                employees={empList}
                value={userId}
                onChange={(id) => setUserId(id)}
                placeholder="Select Subordinate Employee"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Adjustment Type</T>
              </Label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2.5 text-sm font-medium text-[var(--text-main)]"
              >
                {ADJUSTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{/* @ts-ignore */}<T>{t.label}</T></option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Calculation Method</T>
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="method"
                    value="percentage"
                    checked={method === 'percentage'}
                    onChange={() => setMethod('percentage')}
                  />
                  {/* @ts-ignore */}<T>Percentage</T>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="method"
                    value="amount"
                    checked={method === 'amount'}
                    onChange={() => setMethod('amount')}
                  />
                  {/* @ts-ignore */}<T>Absolute Amount</T>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="method"
                    value="target"
                    checked={method === 'target'}
                    onChange={() => setMethod('target')}
                  />
                  {/* @ts-ignore */}<T>Target Salary</T>
                </label>
              </div>
            </div>

            {method === 'percentage' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>Percentage Change (%)</T>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="e.g. 10 or -5"
                  className="rounded-xl"
                />
              </div>
            )}

            {method === 'amount' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>Amount Change (BDT)</T>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000 or -2500"
                  className="rounded-xl"
                />
              </div>
            )}

            {method === 'target' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>New Target Salary (BDT)</T>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(e.target.value)}
                  placeholder="e.g. 65000"
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Reason</T>
              </Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2.5 text-sm font-medium text-[var(--text-main)]"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{/* @ts-ignore */}<T>{r}</T></option>
                ))}
              </select>
            </div>

            {reason === 'Other' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>Custom Reason</T>
                </Label>
                <Input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Describe the adjustment reason"
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Effective Date</T>
              </Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Notes (Optional)</T>
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details for the record..."
                rows={3}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  ⚡ {/* @ts-ignore */}<T>Apply Immediately (Instant Payout/Update)</T>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {/* @ts-ignore */}<T>Update base salary right now without waiting for approval.</T>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoImplement}
                  onChange={(e) => setAutoImplement(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border-hairline)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--emerald)]"></div>
              </label>
            </div>
          </div>

          {userId && selectedEmp && result && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/60 p-4">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Current Salary:</T></span>
                <span className="font-semibold text-[var(--text-main)]">{currentSalary.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-hairline)] pt-2">
                <span className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Proposed Salary:</T></span>
                <span className={`font-bold ${displayedDelta >= 0 ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}`}>
                  {displayedNewSalary.toLocaleString()} BDT
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-hairline)] pt-2">
                <span className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Change:</T></span>
                <span className={`font-semibold ${displayedDelta >= 0 ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}`}>
                  {displayedDelta >= 0 ? '+' : ''}{displayedDelta.toLocaleString()} BDT ({displayedPct}%)
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border-hairline)] pt-4">
            <Button variant="outline" size="sm" type="button" onClick={onSuccess} className="rounded-xl">
              {/* @ts-ignore */}<T>Cancel</T>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || !userId || !result}
              className="rounded-xl"
            >
              {createMutation.isPending ? 'Saving...' : autoImplement ? 'Apply Salary Update' : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
