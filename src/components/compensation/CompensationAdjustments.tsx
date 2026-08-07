'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Check, X, Clock, Trash2, Users, Edit3 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatDate } from '@/lib/format';
import { CreateAdjustmentForm } from '@/components/compensation/CreateAdjustmentForm';
import { BulkAdjustmentModal } from '@/components/compensation/BulkAdjustmentModal';
import { EditAdjustmentModal } from '@/components/compensation/EditAdjustmentModal';
import { toast } from '@/lib/toast';
import { T } from '@/components/Translate';

import { OrgCompensationTree, type OrgNode } from '@/components/compensation/OrgCompensationTree';

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
  const [activeTab, setActiveTab] = useState<'LIST' | 'HIERARCHY'>('LIST');
  const [selectedEmpForAdjustmentId, setSelectedEmpForAdjustmentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingAdj, setEditingAdj] = useState<Adjustment | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: employees = [] } = trpc.registry.searchEmployees.useQuery({ query: '' });

  const { data: liveData = adjustments } = trpc.compensation.getAdjustments.useQuery(undefined, {
    initialData: adjustments,
  });
  const list: Adjustment[] = liveData ?? adjustments;

  const updateStatus = trpc.compensation.updateAdjustmentStatus.useMutation({
    onSuccess: () => {
      utils.compensation.getAdjustments.invalidate();
      utils.invalidate('registry');
      toast.success('Status Updated', 'Compensation adjustment implemented successfully.');
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
      toast.success('Deleted', 'Adjustment record removed.');
      setActionLoadingId(null);
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err?.message || 'Could not delete the adjustment.');
      setActionLoadingId(null);
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
    setActionLoadingId(id);
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
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'LIST'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📋 Adjustments Log</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-slate-800">
            {list.length}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('HIERARCHY')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'HIERARCHY'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🌳 Organization Hierarchy</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-slate-800">
            {employees.length}
          </Badge>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {activeTab === 'LIST' ? (
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
        ) : <div />}

        {canApprove && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkModal(true)} className="rounded-xl">
              <Users className="h-4 w-4" />
              {/* @ts-ignore */}<T>Bulk Adjustment</T>
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setSelectedEmpForAdjustmentId(null); setShowForm(true); }} className="rounded-xl">
              <Plus className="h-4 w-4" />
              {/* @ts-ignore */}<T>New Adjustment</T>
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <CreateAdjustmentForm
              initialUserId={selectedEmpForAdjustmentId || undefined}
              onSuccess={() => {
                setShowForm(false);
                setSelectedEmpForAdjustmentId(null);
              }}
            />
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl overflow-y-auto max-h-[90vh]">
            <BulkAdjustmentModal
              onSuccess={() => setShowBulkModal(false)}
              onClose={() => setShowBulkModal(false)}
            />
          </div>
        </div>
      )}

      {editingAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <EditAdjustmentModal
              adjustment={editingAdj}
              onSuccess={() => setEditingAdj(null)}
              onClose={() => setEditingAdj(null)}
            />
          </div>
        </div>
      )}

      {activeTab === 'HIERARCHY' ? (
        <OrgCompensationTree
          employees={employees}
          canManageCompensation={canApprove}
          onSelectEmployeeForAdjustment={(emp) => {
            setSelectedEmpForAdjustmentId(emp.id);
            setShowForm(true);
          }}
        />
      ) : filtered.length === 0 ? (
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4 hover:border-[var(--brand)]/30 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="mt-1 sm:mt-0">{typeIcon(adj.type)}</div>
                    <div>
                      <p className="font-semibold text-[var(--text-main)]">
                        {adj.user?.name ?? 'Employee'} ({adj.user?.email ?? '—'})
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {adj.user?.department && <span>{adj.user.department} · </span>}
                        <span className="font-semibold">{adj.type}</span> · {adj.reason}
                      </p>
                      {adj.notes && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 italic">{adj.notes}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formatCurrency(adj.oldSalary, 'BDT', 'en')} →{' '}
                        <span className={adj.delta >= 0 ? 'font-bold text-[var(--emerald)]' : 'font-bold text-[var(--rose)]'}>
                          {formatCurrency(adj.newSalary, 'BDT', 'en')}
                        </span>
                        {' '}({adj.delta >= 0 ? '+' : ''}{adj.percentage ?? 0}%){' '}
                        · Effective {formatDate(adj.effectiveDate)}
                        {' '}· Created {formatDate(adj.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {statusBadge(adj.status)}
                    {canApprove && (
                      <div className="flex items-center gap-1">
                        {(adj.status === 'PENDING' || adj.status === 'DRAFT') && (
                          <>
                            <Button
                              size="xs"
                              variant="ghost"
                              title="Approve & Implement"
                              onClick={() => handleApprove(adj.id)}
                              disabled={actionLoadingId === adj.id}
                              className="text-[var(--emerald)] hover:bg-[var(--emerald)]/10"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              title="Reject"
                              onClick={() => handleReject(adj.id)}
                              disabled={actionLoadingId === adj.id}
                              className="text-[var(--rose)] hover:bg-[var(--rose)]/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Edit Adjustment Record"
                          onClick={() => setEditingAdj(adj)}
                          disabled={actionLoadingId === adj.id}
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        </Button>
                        {adj.status !== 'IMPLEMENTED' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Delete Record"
                            onClick={() => handleDelete(adj.id)}
                            disabled={actionLoadingId === adj.id}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[var(--rose)]" />
                          </Button>
                        )}
                      </div>
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
