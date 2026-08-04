'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Check, X, Clock, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatDate } from '@/lib/format';
import { CreateAdjustmentForm } from '@/components/compensation/CreateAdjustmentForm';
import { toast } from '@/lib/toast';
import { T } from '@/components/Translate';

interface Adjustment {
  id: string;
  type: string;
  oldSalary: number;
  newSalary: number;
  delta: number;
  percentage: number | null;
  reason: string;
  effectiveDate: Date;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string; email: string; role: string; department: string | null; designation: string | null };
  requestedBy?: { id: string; name: string; role: string } | null;
  approvedBy?: { id: string; name: string; role: string } | null;
}

export function CompensationAdjustments({ adjustments, isAdmin, canApprove }: { adjustments: Adjustment[]; isAdmin: boolean; canApprove: boolean }) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: liveData = adjustments } = trpc.compensation.getAdjustments.useQuery(undefined, {
    initialData: adjustments,
  });
  const list: Adjustment[] = liveData ?? adjustments;

  const updateStatus = trpc.compensation.updateAdjustmentStatus.useMutation({
    onSuccess: () => {
      utils.compensation.getAdjustments.invalidate();
      toast.success('Status Updated', 'Compensation adjustment status changed.');
      setActionLoadingId(null);
    },
    onError: (err: any) => {
      toast.error('Action Failed', err?.message || 'Could not update the adjustment.');
      setActionLoadingId(null);
    },
  });

  const deleteAdjustment = trpc.compensation.deleteAdjustment.useMutation({
    onSuccess: () => {
      utils.compensation.getAdjustments.invalidate();
      toast.success('Deleted', 'Adjustment removed.');
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err?.message || 'Could not delete the adjustment.');
    },
  });

  const handleApprove = (id: string) => {
    setActionLoadingId(id);
    updateStatus.mutate({ id, status: 'APPROVED' });
  };

  const handleReject = (id: string) => {
    const reason = window.prompt('Rejection reason (optional):') ?? '';
    setActionLoadingId(id);
    updateStatus.mutate({ id, status: 'REJECTED', rejectionReason: reason || undefined });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this adjustment record? This cannot be undone for implemented adjustments.')) return;
    deleteAdjustment.mutate({ id });
  };

  const filtered = statusFilter === 'ALL'
    ? list
    : list.filter((a) => a.status === statusFilter);

  const statusBadge = (status: string) => {
    const variants: Record<string, 'emerald' | 'amber' | 'sky' | 'rose' | 'secondary'> = {
      IMPLEMENTED: 'emerald',
      APPROVED: 'emerald',
      PENDING: 'amber',
      DRAFT: 'secondary',
      REJECTED: 'rose',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const typeIcon = (type: string) => {
    if (type === 'INCREMENT') return <TrendingUp className="h-4 w-4 text-[var(--emerald)]" />;
    if (type === 'DECREMENT') return <TrendingDown className="h-4 w-4 text-[var(--rose)]" />;
    return <Clock className="h-4 w-4 text-[var(--amber)]" />;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('ALL')}
          >
            {/* @ts-ignore */}<T>All</T>
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PENDING')}
          >
            {/* @ts-ignore */}<T>Pending</T>
          </Button>
          <Button
            variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('APPROVED')}
          >
            {/* @ts-ignore */}<T>Approved</T>
          </Button>
          <Button
            variant={statusFilter === 'IMPLEMENTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('IMPLEMENTED')}
          >
            {/* @ts-ignore */}<T>Implemented</T>
          </Button>
          <Button
            variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('REJECTED')}
          >
            {/* @ts-ignore */}<T>Rejected</T>
          </Button>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            {/* @ts-ignore */}<T>New Adjustment</T>
          </Button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <CreateAdjustmentForm onSuccess={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No compensation adjustments"
          description="Salary changes will appear here once created."
          icon={<TrendingUp className="h-6 w-6" />}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{/* @ts-ignore */}<T>Adjustment History</T></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.map((adj) => (
                <div
                  key={adj.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4"
                >
                  <div className="flex items-center gap-4">
                    {typeIcon(adj.type)}
                    <div>
                      <p className="font-semibold text-[var(--text-main)]">
                        {adj.user?.name ?? 'Employee'} ({adj.user?.email ?? '—'})
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {adj.user?.department && <span>{adj.user.department} · </span>}
                        {adj.type} · {adj.reason}
                      </p>
                      {adj.notes && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">{adj.notes}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formatCurrency(adj.oldSalary, 'BDT', 'en')} →{' '}
                        <span className={adj.delta >= 0 ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}>
                          {formatCurrency(adj.newSalary, 'BDT', 'en')}
                        </span>
                        {' '}({adj.delta >= 0 ? '+' : ''}{adj.percentage ?? 0}%){' '}
                        · Effective {formatDate(adj.effectiveDate)}
                        {' '}· Requested {formatDate(adj.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(adj.status)}
                    {canApprove && adj.status === 'PENDING' && (
                      <>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleApprove(adj.id)}
                          disabled={actionLoadingId === adj.id}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleReject(adj.id)}
                          disabled={actionLoadingId === adj.id}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDelete(adj.id)}
                          disabled={actionLoadingId === adj.id || !isAdmin}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
