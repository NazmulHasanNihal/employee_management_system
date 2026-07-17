'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Lock, SlidersHorizontal, Check, User } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/EmptyState';

interface Session {
  id: string;
  label: string;
  reviewPeriod: string;
  status: string;
  createdBy?: { name: string } | null;
}

interface CalibrationIslandProps {
  initialSessions: Session[];
}

export default function CalibrationIsland({ initialSessions }: CalibrationIslandProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeId, setActiveId] = useState<string | null>(initialSessions[0]?.id ?? null);
  const [newSession, setNewSession] = useState({ label: '', reviewPeriod: '' });

  const utils = trpc.useUtils();

  const { data: entries } = trpc.calibration.getEntries.useQuery(
    { sessionId: activeId! },
    { enabled: !!activeId }
  );
  const { data: reviews } = trpc.performance.getReviews.useQuery(undefined, { enabled: !!activeId });

  const createSession = trpc.performance.createCalibrationSession.useMutation({
    onSuccess: (s: any) => {
      setSessions((prev) => [s, ...prev]);
      setActiveId(s.id);
      setNewSession({ label: '', reviewPeriod: '' });
      utils.calibration.getSessions.invalidate();
    },
  });

  const addEntry = trpc.performance.addCalibrationEntry.useMutation({
    onSuccess: () => { if (activeId) utils.calibration.getEntries.invalidate(); },
  });

  const lockSession = trpc.performance.lockCalibrationSession.useMutation({
    onSuccess: (updated: any) => {
      setSessions((prev) => prev.map((s) => (s.id === (updated as any).id ? (updated as Session) : s)));
      utils.calibration.getSessions.invalidate();
    },
  });

  const activeSession = sessions.find((s) => s.id === activeId) || null;
  const entryMap = new Map((entries as any[] | undefined)?.map((e) => [e.reviewId, e]) || []);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      {/* Session list */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontal size={16} className="text-[var(--brand-strong)]" /> Calibration Cycles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSession.label || !newSession.reviewPeriod) return;
                createSession.mutate(newSession);
              }}
            >
              <div className="space-y-1">
                <Label className="text-[var(--text-muted)]">Cycle Label</Label>
                <Input required placeholder="e.g. FY26 H1" value={newSession.label} onChange={(e) => setNewSession({ ...newSession, label: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[var(--text-muted)]">Review Period</Label>
                <Input required placeholder="e.g. 2026-H1" value={newSession.reviewPeriod} onChange={(e) => setNewSession({ ...newSession, reviewPeriod: e.target.value })} />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={createSession.isPending}>
                <Plus size={16} /> New Cycle
              </Button>
            </form>

            <div className="space-y-2 border-t border-[var(--border-hairline)] pt-3">
              {sessions.length === 0 && <p className="text-xs text-[var(--text-muted)]">No cycles yet.</p>}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${activeId === s.id ? 'border-[var(--brand)]/40 bg-[var(--brand-soft)]' : 'border-[var(--border-hairline)] bg-[var(--bg-panel)] hover:border-[var(--brand)]/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-main)]">{s.label}</span>
                    <StatusPill status={s.status === 'Locked' ? 'info' : s.status === 'Open' ? 'pending' : 'warning'} label={s.status} />
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{s.reviewPeriod}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {!activeSession ? (
          <EmptyState title="Select a cycle" description="Create or pick a calibration cycle to begin normalizing scores." icon={<SlidersHorizontal size={22} />} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {activeSession.label} — {activeSession.reviewPeriod}
                </CardTitle>
                {activeSession.status !== 'Locked' ? (
                  <Button variant="outline" size="sm" disabled={lockSession.isPending} onClick={() => lockSession.mutate({ id: activeSession.id, status: 'Locked' })}>
                    <Lock size={14} /> Lock Cycle
                  </Button>
                ) : (
                  <Badge variant="emerald">Locked</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CalibrationGrid
                reviews={reviews as any[] | undefined}
                entryMap={entryMap}
                locked={activeSession.status === 'Locked'}
                onSave={(reviewId, userId, raw, mult, note) =>
                  addEntry.mutate({ sessionId: activeSession.id, reviewId, userId, rawScore: raw, multiplier: mult, note })
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CalibrationGrid({
  reviews,
  entryMap,
  locked,
  onSave,
}: {
  reviews: any[] | undefined;
  entryMap: Map<string, any>;
  locked: boolean;
  onSave: (reviewId: string, userId: string, raw: number, mult: number, note: string) => void;
}) {
  if (!reviews || reviews.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No reviews available to calibrate.</p>;
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <EntryRow key={r.id} review={r} entry={entryMap.get(r.id)} locked={locked} onSave={onSave} />
      ))}
    </div>
  );
}

function EntryRow({
  review,
  entry,
  locked,
  onSave,
}: {
  review: any;
  entry?: any;
  locked: boolean;
  onSave: (reviewId: string, userId: string, raw: number, mult: number, note: string) => void;
}) {
  const [raw, setRaw] = useState(String(entry?.rawScore ?? 0));
  const [mult, setMult] = useState(String(entry?.multiplier ?? 1));
  const [note, setNote] = useState(entry?.note || '');
  const calibrated = Math.round(Number(raw || 0) * Number(mult || 1) * 100) / 100;

  // Map a review rating string to a numeric raw score for convenience.
  const rawFromRating = (rating?: string) => {
    if (!rating) return 0;
    if (String(rating).includes('Exceeds')) return 5;
    if (String(rating).includes('Meets')) return 3;
    if (String(rating).includes('Needs')) return 1;
    return 0;
  };

  return (
    <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
          <User size={14} /> {review.reviewerName} — {review.reviewPeriod}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Calibrated: <strong className="text-[var(--brand-strong)]">{calibrated}</strong>
        </span>
      </div>
      <p className="mt-1 text-xs italic text-[var(--text-muted)]">&ldquo;{review.comments}&rdquo;</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Raw</Label>
          <Input type="number" step="0.1" value={raw} disabled={locked} onChange={(e) => setRaw(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Multiplier</Label>
          <Input type="number" step="0.1" value={mult} disabled={locked} onChange={(e) => setMult(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Note</Label>
          <Input value={note} disabled={locked} onChange={(e) => setNote(e.target.value)} placeholder="Rationale…" />
        </div>
      </div>
      {!locked && (
        <div className="mt-3 flex gap-2">
          <Button variant="primary" size="sm" onClick={() => onSave(review.id, review.userId || '', Number(raw), Number(mult), note)}>
            <Check size={14} /> {entry ? 'Update' : 'Calibrate'}
          </Button>
          {!entry && (
            <Button variant="ghost" size="sm" onClick={() => setRaw(String(rawFromRating(review.rating)))}>
              Use rating
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
