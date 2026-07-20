'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, Umbrella, Syringe, UserCircle2, CalendarCheck, PartyPopper, Baby, Languages } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DeltaBadge } from '@/components/ui/delta-badge';
import { LeaveBreakdownDonut } from '@/components/dashboard/AnalyticsCharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface LeaveClientProps {
  initialRequests: any[];
  initialBalance: any;
  leaveTypes: { id: string; name: string; nameBn?: string | null; category: string; defaultDays: number; applicableGender?: string | null }[];
  isAdmin: boolean;
  lang: string;
}

const CAT_ICON: Record<string, React.ReactNode> = {
  Casual: <Umbrella className="h-3.5 w-3.5" />,
  Earned: <CalendarCheck className="h-3.5 w-3.5" />,
  Sick: <Syringe className="h-3.5 w-3.5" />,
  Festival: <PartyPopper className="h-3.5 w-3.5" />,
  Maternity: <Baby className="h-3.5 w-3.5" />,
  Paternity: <Baby className="h-3.5 w-3.5" />,
};

function PlusIcon() {
  return <Calendar className="h-4 w-4 text-[var(--emerald)]" />;
}

export function LeaveClient({ initialRequests, initialBalance, leaveTypes, isAdmin, lang }: LeaveClientProps) {
  const [type, setType] = useState(leaveTypes[0]?.name || 'Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Live list (seeded with server prop) so submitting/approving refreshes in
  // place instead of requiring navigation.
  const utils = trpc.useUtils();
  const { data: requestsData } = trpc.leave.getRequests.useQuery(undefined, { initialData: initialRequests as any });
  const requests = (requestsData as any[] | undefined) ?? initialRequests ?? [];
  const { data: balanceData } = trpc.leave.getBalance.useQuery(undefined, { initialData: initialBalance as any });
  const balance = (balanceData as any) ?? initialBalance;

  // Language-aware label: Bangla mode shows Bangla only (falling back to EN),
  // English mode shows English only (no Bangla appended).
  const labelFor = (en: string, bn?: string | null) => {
    if (lang === 'bn') return bn || en;
    return en;
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const submitRequest = trpc.leave.submitRequest.useMutation({
    onSuccess: () => {
      utils.leave.getRequests.invalidate();
      utils.leave.getBalance.invalidate();
      setStartDate('');
      setEndDate('');
      setReason('');
    },
  });

  const updateStatus = trpc.leave.updateStatus.useMutation({
    onSuccess: () => utils.leave.getRequests.invalidate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason || !type) return;
    submitRequest.mutate({
      type,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      reason,
    });
  };

  const balanceRows = balance
    ? Object.entries(balance as Record<string, { total: number; used: number; remaining: number }>).map(
        ([key, data]) => {
          const lt = leaveTypes.find((l) => l.category === key);
          return {
            key,
            label: labelFor(key, lt?.nameBn),
            icon: CAT_ICON[key] || <UserCircle2 className="h-3.5 w-3.5" />,
            data,
          };
        }
      )
    : [];

  // Org-wide leave analytics (admins only). Derived from the request list
  // already loaded, so no extra query is needed.
  const leaveAnalytics = (() => {
    const reqs = (requests || []) as any[];
    const total = reqs.length;
    const approved = reqs.filter((r) => r.status === 'Approved').length;
    const rejected = reqs.filter((r) => r.status === 'Rejected').length;
    const pending = reqs.filter((r) => r.status === 'Pending').length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const byTypeMap: Record<string, number> = {};
    reqs.forEach((r) => { byTypeMap[r.type] = (byTypeMap[r.type] || 0) + 1; });
    const byType = Object.entries(byTypeMap).map(([type, count]) => ({ type, count }));
    return { total, approved, rejected, pending, approvalRate, byType };
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {balanceRows.map((row) => {
          const remaining = row.data?.remaining ?? 0;
          const total = row.data?.total || 1;
          const used = row.data?.used ?? 0;
          const pct = Math.min(100, Math.round((remaining / total) * 100));
          return (
            <Card key={row.key}>
              <CardContent>
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {row.icon} {row.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-main)]">
                  {String(remaining).padStart(2, '0')}
                </p>
                <p className="text-sm text-[var(--text-muted)]">Available · {used} used of {total}</p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
                  <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-3 gap-4 lg:col-span-2">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4 text-center">
              <p className="text-2xl font-bold text-[var(--emerald)]">{leaveAnalytics.approvalRate}%</p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Approval Rate</p>
              <DeltaBadge value={leaveAnalytics.approvalRate} label="approved" goodWhen="up" className="mt-1" />
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4 text-center">
              <p className="text-2xl font-bold text-[var(--amber)]">{leaveAnalytics.pending}</p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Pending</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4 text-center">
              <p className="text-2xl font-bold text-[var(--rose)]">{leaveAnalytics.rejected}</p>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Rejected</p>
            </div>
          </div>
          <LeaveBreakdownDonut data={leaveAnalytics.byType} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusIcon /> File New Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Leave Category</label>
                  <select className="ledger-input w-full cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-shadow focus:outline-none" value={type} onChange={(e) => setType(e.target.value)}>
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.name}>
                        {labelFor(lt.name, lt.nameBn)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <Languages className="h-3 w-3" /> Per Bangladesh Labour Act (2006)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Start Date</label>
                    <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">End Date</label>
                    <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Reason (Required)</label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide details for your absence..."
                    className="ledger-input resize-none"
                  />
                </div>
                <Button type="submit" disabled={submitRequest.isPending || !startDate || !endDate || !reason} className="w-full">
                  {submitRequest.isPending ? 'Filing...' : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--text-muted)]" /> Request History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {(!requests || requests.length === 0) ? (
                <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
                  <Umbrella className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-muted)]">No Leave History</h3>
                </div>
              ) : (
                <div className="max-h-[525px] space-y-3 overflow-y-auto">
                  {requests.map((req: any) => {
                    const cat = leaveTypes.find((l) => l.name === req.type)?.category || req.type;
                    return (
                      <div
                        key={req.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                            {CAT_ICON[cat] || <Umbrella className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-semibold text-[var(--text-main)]">{req.type} Leave</h5>
                              <Badge variant={req.status === 'Approved' ? 'emerald' : req.status === 'Rejected' ? 'rose' : 'amber'}>
                                {req.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {fmtDate(req.startDate)} - {fmtDate(req.endDate)}
                            </p>
                            <p className="mt-1 text-xs italic text-[var(--text-muted)]">"{req.details}"</p>
                            {isAdmin && (
                              <p className="mt-1 text-xs text-[var(--brand-strong)]">Requested By: {req.user?.name || 'Unknown'}</p>
                            )}
                          </div>
                        </div>

                        {isAdmin && req.status === 'Pending' && (
                          <div className="flex shrink-0 gap-2 border-t border-[var(--border-hairline)] pt-3 md:border-t-0 md:pt-0">
                            <Button variant="outline" size="sm" className="text-[var(--emerald)]" onClick={() => updateStatus.mutate({ id: req.id, status: 'Approved' })}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => updateStatus.mutate({ id: req.id, status: 'Rejected' })}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
