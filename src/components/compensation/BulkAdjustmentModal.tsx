'use client';

import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { T } from '@/components/Translate';

import { isSalaryExempt } from '@/lib/hierarchy';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export function BulkAdjustmentModal({ onSuccess, onClose }: Props) {
  const utils = trpc.useUtils();
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [method, setMethod] = useState<'percentage' | 'amount'>('percentage');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('Annual Cost of Living Adjustment');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [autoImplement, setAutoImplement] = useState(true);

  const { data: employees = [] } = trpc.registry.searchEmployees.useQuery({ query: '' });
  const { data: departments = [] } = trpc.departments.getDepartments.useQuery();

  const bulkMutation = trpc.compensation.bulkAdjust.useMutation({
    onSuccess: (res: any) => {
      toast.success(
        'Bulk Adjustment Completed',
        `Successfully applied adjustment to ${res.count} employee(s).`
      );
      utils.compensation.getAdjustments.invalidate();
      utils.invalidate('registry');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error('Bulk Adjustment Failed', err?.message || 'Could not process bulk adjustment.');
    },
  });

  const empList = Array.isArray(employees) ? employees : [];

  const matchedEmployees = empList.filter((e: any) => {
    if (isSalaryExempt(e.role)) return false;
    if (department && e.department !== department) return false;
    if (role && e.role !== role) return false;
    return true;
  });

  const valNum = Number(value) || 0;

  const calculatePreview = () => {
    let totalOld = 0;
    let totalNew = 0;
    const items = matchedEmployees.map((e: any) => {
      const oldSalary = e.baseSalary || 0;
      let newSalary = oldSalary;
      if (method === 'percentage') {
        newSalary = Math.round((oldSalary * (1 + valNum / 100)) * 100) / 100;
      } else {
        newSalary = Math.round((oldSalary + valNum) * 100) / 100;
      }
      totalOld += oldSalary;
      totalNew += newSalary;
      return { id: e.id, name: e.name, oldSalary, newSalary, delta: newSalary - oldSalary };
    });
    return { items, totalOld, totalNew, netImpact: totalNew - totalOld };
  };

  const preview = calculatePreview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedEmployees.length === 0) {
      toast.error('No Matching Employees', 'Select valid filter criteria with active employees.');
      return;
    }
    if (!valNum) {
      toast.error('Invalid Value', 'Please enter a non-zero percentage or amount.');
      return;
    }

    bulkMutation.mutate({
      userFilter: {
        department: department || undefined,
        role: role || undefined,
      },
      method,
      value: valNum,
      reason,
      effectiveDate,
      notes: notes || undefined,
      autoImplement,
    });
  };

  return (
    <Card className="bg-[var(--bg-panel)] border border-[var(--brand)]/30 shadow-2xl animate-in zoom-in-95 rounded-3xl max-w-4xl w-full">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--brand)]/10 p-2.5 text-[var(--brand)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                {/* @ts-ignore */}<T>Bulk Salary Adjustment</T>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Apply salary increments or decrements to teams & departments at any time.</T>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Department Filter</T>
              </Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2.5 text-sm font-medium text-[var(--text-main)]"
              >
                <option value="">{/* @ts-ignore */}<T>All Departments</T></option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Role Filter</T>
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2.5 text-sm font-medium text-[var(--text-main)]"
              >
                <option value="">{/* @ts-ignore */}<T>All Roles</T></option>
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR Manager">HR Manager</option>
                <option value="Director">Director</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Adjustment Method</T>
              </Label>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant={method === 'percentage' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => setMethod('percentage')}
                >
                  {/* @ts-ignore */}<T>Percentage (%)</T>
                </Button>
                <Button
                  type="button"
                  variant={method === 'amount' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => setMethod('amount')}
                >
                  {/* @ts-ignore */}<T>Amount (BDT)</T>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {method === 'percentage' ? 'Percentage Change (%)' : 'Amount Change (BDT)'}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={method === 'percentage' ? 'e.g. 5 (increment) or -3 (decrement)' : 'e.g. 3000 or -1500'}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Reason</T>
              </Label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for bulk change..."
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Effective Date</T>
              </Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                ⚡ {/* @ts-ignore */}<T>Apply Immediately (Instant Payout/Update)</T>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {/* @ts-ignore */}<T>Directly update base salaries for all matching employees now.</T>
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

          {matchedEmployees.length > 0 && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-app)] p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Matched Employees ({matchedEmployees.length})
                </span>
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  Net Monthly Payroll Impact:{' '}
                  <span className={preview.netImpact >= 0 ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}>
                    {preview.netImpact >= 0 ? '+' : ''}{formatCurrency(preview.netImpact, 'BDT', 'en')}
                  </span>
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {preview.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-[var(--bg-panel)]">
                    <span className="font-medium text-[var(--text-main)]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(item.oldSalary, 'BDT', 'en')}</span>
                      <span>→</span>
                      <span className={item.delta >= 0 ? 'font-bold text-[var(--emerald)]' : 'font-bold text-[var(--rose)]'}>
                        {formatCurrency(item.newSalary, 'BDT', 'en')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border-hairline)] pt-4">
            <Button variant="outline" size="sm" type="button" onClick={onClose} className="rounded-xl">
              {/* @ts-ignore */}<T>Cancel</T>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={bulkMutation.isPending || matchedEmployees.length === 0 || !valNum}
              className="rounded-xl"
            >
              {bulkMutation.isPending ? 'Processing...' : `Execute Bulk Adjustment (${matchedEmployees.length} Users)`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
