'use client';

import React, { useState } from 'react';
import { Edit3, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { T } from '@/components/Translate';

interface Adjustment {
  id: string;
  type: string;
  oldSalary: number;
  newSalary: number;
  delta: number;
  percentage: number | null;
  reason: string;
  effectiveDate: Date | string;
  notes: string | null;
  status: string;
  user?: { name: string; email: string };
}

interface Props {
  adjustment: Adjustment;
  onSuccess: () => void;
  onClose: () => void;
}

export function EditAdjustmentModal({ adjustment, onSuccess, onClose }: Props) {
  const utils = trpc.useUtils();
  const [newSalary, setNewSalary] = useState(String(adjustment.newSalary));
  const [reason, setReason] = useState(adjustment.reason);
  const [effectiveDate, setEffectiveDate] = useState(
    typeof adjustment.effectiveDate === 'string'
      ? adjustment.effectiveDate.split('T')[0]
      : new Date(adjustment.effectiveDate).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(adjustment.notes || '');

  const editMutation = trpc.compensation.editAdjustment.useMutation({
    onSuccess: () => {
      toast.success('Adjustment Updated', 'Compensation adjustment details saved.');
      utils.compensation.getAdjustments.invalidate();
      utils.invalidate('registry');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error('Update Failed', err?.message || 'Could not edit adjustment.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = Number(newSalary);
    if (isNaN(sal) || sal < 0) {
      toast.error('Invalid Salary', 'Please enter a valid salary amount.');
      return;
    }

    editMutation.mutate({
      id: adjustment.id,
      newSalary: sal,
      reason,
      effectiveDate,
      notes: notes || undefined,
    });
  };

  return (
    <Card className="bg-[var(--bg-panel)] border border-[var(--brand)]/30 shadow-2xl animate-in zoom-in-95 rounded-3xl max-w-lg w-full">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--brand)]/10 p-2.5 text-[var(--brand)]">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                {/* @ts-ignore */}<T>Edit Compensation Record</T>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {adjustment.user?.name ? `${adjustment.user.name} (${adjustment.user.email})` : 'Compensation Adjustment'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {/* @ts-ignore */}<T>New Target Salary (BDT)</T>
            </Label>
            <Input
              type="number"
              step="0.01"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              className="rounded-xl"
              required
            />
            <p className="text-xs text-[var(--text-muted)]">
              Base salary: {formatCurrency(adjustment.oldSalary, 'BDT', 'en')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {/* @ts-ignore */}<T>Reason</T>
            </Label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {/* @ts-ignore */}<T>Notes</T>
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--border-hairline)] pt-4">
            <Button variant="outline" size="sm" type="button" onClick={onClose} className="rounded-xl">
              {/* @ts-ignore */}<T>Cancel</T>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={editMutation.isPending}
              className="rounded-xl"
            >
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
