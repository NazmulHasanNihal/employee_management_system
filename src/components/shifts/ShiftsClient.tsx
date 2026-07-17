'use client';

import React, { useState } from 'react';
import { CalendarRange, Plus, Trash2, CalendarDays, Zap, Clock, UserCircle2, BrainCircuit, Pencil } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

interface ShiftsClientProps {
  shifts: any[];
  initialAssignments: any[];
  branches: any[];
  isAdmin: boolean;
}

export function ShiftsClient({ shifts, initialAssignments, branches, isAdmin }: ShiftsClientProps) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAssign, setNewAssign] = useState({ userId: '', shiftId: '' });
  const [showShiftEditor, setShowShiftEditor] = useState(false);

  const utils = trpc.useUtils();
  const { data: assignments, isLoading: assignLoading } = trpc.shifts.getAssignments.useQuery(
    { date: selectedDate },
    { initialData: initialAssignments, enabled: isAdmin }
  );

  const assignShift = trpc.shifts.assignShift.useMutation({
    onSuccess: () => {
      utils.shifts.getAssignments.invalidate();
      setShowAssignForm(false);
      setNewAssign({ userId: '', shiftId: '' });
    },
  });

  const removeAssignment = trpc.shifts.removeAssignment.useMutation({
    onSuccess: () => utils.shifts.getAssignments.invalidate(),
  });

  const autoGenerate = trpc.shifts.autoGenerateRoster.useMutation({
    onSuccess: () => utils.shifts.getAssignments.invalidate(),
  });

  const createShift = trpc.shifts.createShift.useMutation({
    onSuccess: () => { utils.invalidate('shifts'); setShowShiftEditor(false); },
  });
  const updateShift = trpc.shifts.updateShift.useMutation({
    onSuccess: () => { utils.invalidate('shifts'); setEditingShiftId(null); },
  });

  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftDraft, setShiftDraft] = useState({
    id: '', name: '', startTime: '09:00', endTime: '17:00', location: '', graceMinutes: 10, breakMinutes: 60, isNightShift: false, branchId: '',
  });

  const openEditor = (shift?: any) => {
    setShiftDraft({
      id: shift?.id || '',
      name: shift?.name || '',
      startTime: shift?.startTime || '09:00',
      endTime: shift?.endTime || '17:00',
      location: shift?.location || '',
      graceMinutes: shift?.graceMinutes ?? 10,
      breakMinutes: shift?.breakMinutes ?? 60,
      isNightShift: Boolean(shift?.isNightShift),
      branchId: shift?.branchId || '',
    });
    setShowShiftEditor(true);
    setEditingShiftId(shift?.id || null);
  };

  const saveShift = () => {
    const payload = {
      ...shiftDraft,
      graceMinutes: Number(shiftDraft.graceMinutes),
      breakMinutes: Number(shiftDraft.breakMinutes),
    };
    if (editingShiftId) updateShift.mutate(payload);
    else createShift.mutate(payload);
  };

  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin && showAssignForm });

  const assignmentList = isAdmin ? (assignments || []) : initialAssignments;

  const groupedAssignments: Record<string, any[]> = {};
  shifts.forEach((s: any) => {
    groupedAssignments[s.id] = assignmentList.filter((a: any) => a.shiftId === s.id) || [];
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Shift Roster</h1>
            <p className="page-subtitle">Intelligent workforce scheduling &amp; assignment.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={autoGenerate.isPending}
                onClick={() => autoGenerate.mutate({ startDate: selectedDate })}
              >
                {autoGenerate.isPending ? <BrainCircuit className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
                {autoGenerate.isPending ? 'AI Computing...' : 'Auto-Fill Roster'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAssignForm((s) => !s)}>
                <Plus className="h-4 w-4" /> Assign
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowShiftEditor((s) => !s); if (!showShiftEditor) { setEditingShiftId(null); setShiftDraft({ id: '', name: '', startTime: '09:00', endTime: '17:00', location: '', graceMinutes: 10, breakMinutes: 60, isNightShift: false, branchId: '' }); } }}>
                <CalendarRange className="h-4 w-4" /> {showShiftEditor ? 'Close Editor' : 'New Shift'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showAssignForm && isAdmin && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-[var(--brand-strong)]" /> Manual Shift Override
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 items-end gap-4 md:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                assignShift.mutate({ ...newAssign, date: selectedDate });
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Select Personnel</label>
                <select
                  required
                  className="ledger-input"
                  value={newAssign.userId}
                  onChange={(e) => setNewAssign({ ...newAssign, userId: e.target.value })}
                >
                  <option value="">-- Browse Directory --</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} - {u.designation}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Target Shift</label>
                <select
                  required
                  className="ledger-input"
                  value={newAssign.shiftId}
                  onChange={(e) => setNewAssign({ ...newAssign, shiftId: e.target.value })}
                >
                  <option value="">-- Select Block --</option>
                  {shifts.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={assignShift.isPending || !newAssign.userId || !newAssign.shiftId}>
                Confirm Override
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showShiftEditor && isAdmin && (
        <Card className="animate-scale-in border-[var(--brand)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-[var(--brand-strong)]" /> {editingShiftId ? 'Edit Shift' : 'Create Shift'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Name</label>
                <Input value={shiftDraft.name} onChange={(e) => setShiftDraft({ ...shiftDraft, name: e.target.value })} placeholder="e.g. Morning" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Start Time</label>
                <Input type="time" value={shiftDraft.startTime} onChange={(e) => setShiftDraft({ ...shiftDraft, startTime: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">End Time</label>
                <Input type="time" value={shiftDraft.endTime} onChange={(e) => setShiftDraft({ ...shiftDraft, endTime: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Location</label>
                <Input value={shiftDraft.location} onChange={(e) => setShiftDraft({ ...shiftDraft, location: e.target.value })} placeholder="e.g. Factory Floor" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Grace (min)</label>
                <Input type="number" value={shiftDraft.graceMinutes} onChange={(e) => setShiftDraft({ ...shiftDraft, graceMinutes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Break (min)</label>
                <Input type="number" value={shiftDraft.breakMinutes} onChange={(e) => setShiftDraft({ ...shiftDraft, breakMinutes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Branch</label>
                <select value={shiftDraft.branchId} onChange={(e) => setShiftDraft({ ...shiftDraft, branchId: e.target.value })} className="ledger-input">
                  <option value="">— No branch —</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input type="checkbox" checked={shiftDraft.isNightShift} onChange={(e) => setShiftDraft({ ...shiftDraft, isNightShift: e.target.checked })} />
                  Night shift (night differential)
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowShiftEditor(false); setEditingShiftId(null); }}>Cancel</Button>
              <Button onClick={saveShift} disabled={createShift.isPending || updateShift.isPending || !shiftDraft.name}>{editingShiftId ? 'Save Changes' : 'Create Shift'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {(assignLoading && isAdmin) ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading roster...</div>
        ) : (
          shifts.map((shift: any) => {
            const shiftAssignments = groupedAssignments[shift.id] || [];
            return (
              <Card key={shift.id}>
                <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      <Clock className="h-6 w-6" />
                    </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-main)]">{shift.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {shift.startTime} - {shift.endTime} • {shift.location || 'HQ Building'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[9px] uppercase text-[var(--text-muted)]">Grace {shift.graceMinutes ?? 10}m</span>
                      <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[9px] uppercase text-[var(--text-muted)]">Break {shift.breakMinutes ?? 60}m</span>
                      {shift.isNightShift && <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[9px] uppercase text-[var(--brand-strong)]">Night</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditor(shift)} aria-label="Edit shift">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-2 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Headcount</p>
                    <p className="text-lg font-bold text-[var(--text-main)]">{shiftAssignments.length}</p>
                  </div>
                </div>
                </div>

                <CardContent>
                  {shiftAssignments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                      No personnel assigned to this block.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {shiftAssignments.map((assignment: any) => (
                        <div
                          key={assignment.id}
                          className="group/card flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar src={assignment.userAvatar} name={assignment.userName} size="md" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--text-main)]">{assignment.userName}</p>
                              <p className="truncate text-xs text-[var(--text-muted)]">{assignment.userRole || 'Staff'}</p>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => removeAssignment.mutate({ id: assignment.id })}
                              className="text-[var(--text-muted)] opacity-0 transition-all hover:text-[var(--rose)] group-hover/card:opacity-100"
                              title="Remove Assignment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {(!shifts || shifts.length === 0) && (
          <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">No shifts configured in the system.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
