'use client';

import React, { useState } from 'react';
import { Lock, FileDigit, Search, ShieldCheck, UserPlus, Crown, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from '@/lib/toast';

interface AuditClientPageProps {
  initialEvents: any[];
  isCEO: boolean;
}

export default function AuditClientPage({ initialEvents, isCEO }: AuditClientPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: employees = [] } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isCEO });
  const updatePermissions = trpc.user.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success('Access Granted', 'Audit Log viewing permission successfully assigned.');
      setShowGrantModal(false);
    },
    onError: (err: any) => {
      toast.error('Failed', err?.message || 'Could not update permissions');
    },
  });

  const handleGrantAccess = () => {
    if (!selectedUserId) return;
    updatePermissions.mutate({ userId: selectedUserId, permissions: ['AUDIT_LOG_ACCESS'] });
  };

  const events = initialEvents || [];
  const filteredEvents = events.filter(
    (event: any) =>
      event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.actorName && event.actorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
      {/* Top Controls & CEO Access Delegation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search action, hash, or actor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 ledger-input rounded-xl"
          />
        </div>

        {isCEO && (
          <Button
            onClick={() => setShowGrantModal(true)}
            variant="primary"
            size="sm"
            className="rounded-xl flex items-center gap-2 text-xs font-semibold"
          >
            <Crown size={14} className="text-[var(--amber)]" /> CEO: Delegate Audit Power
          </Button>
        )}
      </div>

      {/* Audit Log Table Card */}
      <Card>
        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No Audit Events Recorded"
            description="No security or system records match your search filter."
            icon={<FileDigit className="h-5 w-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event ID / Hash</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono font-semibold text-xs text-[var(--text-main)]">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                    {event.hash || event.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-[var(--text-main)]">{event.actorName || event.actorId}</span>
                      <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{event.actorRole}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="font-mono uppercase tracking-wide text-[10px]">
                      {event.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--text-muted)] max-w-xs truncate">
                    {event.details ? JSON.stringify(event.details) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* CEO Audit Access Granting Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[var(--amber)]" />
                <h3 className="text-base font-bold text-[var(--text-main)]">Delegate Audit Log Access</h3>
              </div>
              <button onClick={() => setShowGrantModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              As CEO / Founder, select an employee account to grant confidential Audit Log viewing permissions.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Select Account</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="ledger-input w-full rounded-xl px-3 py-2.5 text-xs font-medium"
              >
                <option value="">Select Employee Account...</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role} · {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setShowGrantModal(false)} variant="outline" size="sm" className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleGrantAccess}
                disabled={!selectedUserId || updatePermissions.isPending}
                variant="primary"
                size="sm"
                className="rounded-xl flex items-center gap-1.5"
              >
                <Check size={14} /> Grant Permission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
