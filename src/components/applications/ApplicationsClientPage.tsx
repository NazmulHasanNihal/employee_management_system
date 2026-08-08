'use client';

import React, { useState } from 'react';
import { Download, Check, X, Plus, Send, Network, Server, Fingerprint } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { StatusBadge } from '../StatusBadge';
import { EmptyState } from '../EmptyState';
import { toast } from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { T } from "@/components/Translate";

interface ApplicationsClientPageProps {
  initialApps: any[];
  isAdmin: boolean;
}

export default function ApplicationsClientPage({ initialApps, isAdmin }: ApplicationsClientPageProps) {
  const { user } = useUser();

  const [showModal, setShowModal] = useState(false);
  const [newApp, setNewApp] = useState({ type: 'Leave Request', details: '' });
  const [localApps, setLocalApps] = useState<any[]>(initialApps || []);

  const { data: apps, refetch } = trpc.applications.list.useQuery(
    { userId: isAdmin ? undefined : user?.id },
    { enabled: !!user }
  );

  React.useEffect(() => {
    if (apps) setLocalApps(apps);
  }, [apps]);

  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setShowModal(false);
      setNewApp({ type: 'Leave Request', details: '' });
      refetch();
    }
  });

  const updateMutation = trpc.applications.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: () => {
      if (apps) setLocalApps(apps);
    }
  });

  const handleUpdate = (id: string, status: string) => {
    setLocalApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    updateMutation.mutate({ id, status });
  };

  const applicationsList = localApps || [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <header className="page-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">{/* @ts-ignore */}<T>Operations Hub</T></h1>
            <p className="page-subtitle">
              {isAdmin ? 'Global request & authorization queue.' : 'My formal requests & authorizations.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toast.info('CSV Export Triggered', 'Your export is being prepared.')}
            className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" /> {/* @ts-ignore */}<T>Export</T></button>
          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> {/* @ts-ignore */}<T>New Request</T></button>
          )}
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
            <Server className="h-4 w-4 text-[var(--text-muted)]" /> {/* @ts-ignore */}<T>Authorization Ledger</T></h3>
        </div>

        <div className="overflow-x-auto">
          {applicationsList.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Operations Queue is Empty"
                description="There are no formal requests awaiting authorization."
                actionText={!isAdmin ? 'New Request' : undefined}
                onAction={!isAdmin ? () => setShowModal(true) : undefined}
              />
            </div>
          ) : (
              <table className="w-full text-left table-responsive-card">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-hover)]">
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]" data-label="ID">{/* @ts-ignore */}<T>Trace ID</T></th>
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]" data-label="Type">{/* @ts-ignore */}<T>Vector / Type</T></th>
                    {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]" data-label="Origin">{/* @ts-ignore */}<T>Origin Entity</T></th>}
                    <th className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)]" data-label="Details">{/* @ts-ignore */}<T>Payload Details</T></th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-muted)]" data-label="Status">{/* @ts-ignore */}<T>Clearance Status</T></th>
                    {isAdmin && <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-muted)]" data-label="Actions">{/* @ts-ignore */}<T>Overrides</T></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {applicationsList.map((app: any) => (
                    <tr key={app.id} className="group hover:bg-[var(--bg-hover)]">
                      <td className="px-6 py-4 text-xs text-[var(--text-muted)]" data-label="ID">{app.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-xs font-semibold uppercase text-[var(--text-main)]" data-label="Type">{app.type}</td>
                      {isAdmin && <td className="px-6 py-4 text-xs text-[var(--text-main)]" data-label="Origin">{app.user?.name}</td>}
                       <td className="max-w-xs truncate px-6 py-4 text-xs italic text-[var(--text-muted)]" data-label="Details">"{app.details}"</td>
                      <td className="px-6 py-4 text-center" data-label="Status">
                        <StatusBadge status={app.status.toUpperCase()} />
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right" data-label="Actions">
                          {app.status.includes('Pending') ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleUpdate(app.id, 'Approved')} className="flex items-center gap-1 rounded-lg bg-[var(--emerald-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--emerald)] transition-colors hover:bg-[var(--emerald)] hover:text-white" title="Approve">
                                <Check className="h-3.5 w-3.5" /> {/* @ts-ignore */}<T>Approve</T></button>
                              <button onClick={() => handleUpdate(app.id, 'Rejected')} className="flex items-center gap-1 rounded-lg bg-[var(--rose-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--rose)] transition-colors hover:bg-[var(--rose)] hover:text-white" title="Reject">
                                <X className="h-3.5 w-3.5" /> {/* @ts-ignore */}<T>Reject</T></button>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
      </Card>

      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="w-full max-w-md max-h-[85vh] overflow-y-auto my-auto rounded-2xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <Fingerprint className="h-4 w-4 text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Authorize New Request</T></h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(newApp); }}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Request Vector</T></label>
                <select
                  value={newApp.type}
                  onChange={(e) => setNewApp({ ...newApp, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Leave Request">{/* @ts-ignore */}<T>Leave / PTO</T></option>
                  <option value="Expense Claim">{/* @ts-ignore */}<T>Expense Claim</T></option>
                  <option value="Hardware Upgrade">{/* @ts-ignore */}<T>Hardware Upgrade</T></option>
                  <option value="Travel Authorization">{/* @ts-ignore */}<T>Travel Authorization</T></option>
                  <option value="Access Request">{/* @ts-ignore */}<T>System Access Request</T></option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Payload Specifications</T></label>
                <textarea
                  required
                  rows={4}
                  value={newApp.details}
                  onChange={(e) => setNewApp({ ...newApp, details: e.target.value })}
                  placeholder="Provide detailed justification..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitMutation.isPending || !newApp.details.trim()}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> {/* @ts-ignore */}<T>Transmit Request</T></button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
