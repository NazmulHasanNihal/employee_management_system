'use client';

import React, { useState } from 'react';
import { EyeOff, Users, UserPlus, Trash2, Crown, Search, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/EmptyState';

interface Report {
  id: string;
  report: string;
  status: string;
  assignedTo?: string | null;
  resolution?: string | null;
  createdAt: Date;
}
interface Member {
  id: string;
  name: string;
  role: string;
  isChair: boolean;
  email?: string | null;
}

const STATUS_FLOW = ['Received', 'Investigating', 'Resolved'];

interface WhistleblowerIslandProps {
  initialReports: Report[];
  initialMembers: Member[];
}

export default function WhistleblowerIsland({ initialReports, initialMembers }: WhistleblowerIslandProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState('');
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  const utils = trpc.useUtils();

  // ── Report mutations ──
  const updateStatus = trpc.whistleblower.updateStatus.useMutation({
    onSuccess: (u: Report) => {
      setReports((prev) => prev.map((r) => (r.id === u.id ? u : r)));
      utils.whistleblower.reports.invalidate();
    },
  });
  const assign = trpc.whistleblower.assign.useMutation({
    onSuccess: (u: Report) => {
      setReports((prev) => prev.map((r) => (r.id === u.id ? u : r)));
      utils.whistleblower.reports.invalidate();
    },
  });

  // ── Committee mutations ──
  const addMember = trpc.committee.addMember.useMutation({
    onSuccess: (m: Member) => { setMembers((prev) => [...prev, m]); utils.committee.members.invalidate(); setNewMember({ name: '', role: '' }); },
  });
  const removeMember = trpc.committee.removeMember.useMutation({
    onSuccess: (d: { id: string }) => { setMembers((prev) => prev.filter((m) => m.id !== d.id)); utils.committee.members.invalidate(); },
  });
  const setChair = trpc.committee.setChair.useMutation({
    onSuccess: () => { utils.committee.members.invalidate(); },
  });

  const advanceStatus = (r: Report) => {
    const idx = STATUS_FLOW.indexOf(r.status);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    updateStatus.mutate({ id: r.id, status: next, resolution: r.resolution || undefined });
  };

  const filteredReports = reports.filter((r) => r.report.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      {/* Reports workflow */}
      <div className="space-y-4">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input aria-label="Search reports" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="pl-9" />
        </div>

        {filteredReports.length === 0 ? (
          <EmptyState title="No reports" description="Confidential disclosures will appear here as they are submitted." icon={<EyeOff size={22} />} />
        ) : (
          <div className="space-y-4">
            {filteredReports.map((r) => (
              <Card key={r.id} className="border-[var(--rose)]/30">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1 text-sm leading-relaxed text-[var(--text-main)]">{r.report}</p>
                    <StatusPill
                      status={r.status === 'Resolved' ? 'success' : r.status === 'Investigating' ? 'pending' : 'warning'}
                      label={r.status}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      Assigned: <Badge variant={r.assignedTo ? 'sky' : 'rose'}>{r.assignedTo || 'Unassigned'}</Badge>
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[var(--border-hairline)] pt-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Assign to</Label>
                      <select
                        aria-label="Assign report to committee member"
                        className="ledger-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                        value={r.assignedTo || ''}
                        onChange={(e) => assign.mutate({ id: r.id, assignedTo: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => advanceStatus(r)} disabled={r.status === 'Resolved'}>
                      Advance <ChevronRight size={14} />
                    </Button>
                  </div>

                  {r.status === 'Resolved' && (
                    <textarea
                      rows={2}
                      defaultValue={r.resolution || ''}
                      placeholder="Resolution notes…"
                      aria-label="Resolution notes"
                      className="ledger-input w-full rounded-xl p-3 text-sm outline-none"
                      onBlur={(e) => updateStatus.mutate({ id: r.id, status: 'Resolved', resolution: e.target.value })}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Committee roster */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users size={16} className="text-[var(--brand-strong)]" /> Ethics Committee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMember.name || !newMember.role) return;
                addMember.mutate(newMember);
              }}
            >
              <div className="space-y-1">
                <Label className="text-[var(--text-muted)]">Member Name</Label>
                <Input required placeholder="e.g. Jane Doe" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[var(--text-muted)]">Role</Label>
                <Input required placeholder="e.g. External Auditor" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={addMember.isPending}>
                <UserPlus size={16} /> Add Member
              </Button>
            </form>

            <div className="space-y-2 border-t border-[var(--border-hairline)] pt-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-3">
                  <div className="flex items-center gap-2">
                    {m.isChair && <Crown size={14} className="text-[var(--amber)]" />}
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">{m.name}</p>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{m.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!m.isChair && (
                      <button
                        aria-label={`Set ${m.name} as chair`}
                        onClick={() => setChair.mutate({ id: m.id })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--amber)]/40 bg-[var(--amber-soft)] text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-white"
                        title="Set as Chair"
                      >
                        <Crown size={14} />
                      </button>
                    )}
                    <button
                      aria-label={`Remove ${m.name}`}
                      onClick={() => removeMember.mutate({ id: m.id })}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--rose)]/40 bg-[var(--rose-soft)] text-[var(--rose)] transition-colors hover:bg-[var(--rose)] hover:text-white"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
