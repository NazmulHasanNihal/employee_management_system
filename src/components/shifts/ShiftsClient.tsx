'use client';

import React, { useState } from 'react';
import { CalendarRange, Plus, Trash2, CalendarDays, Zap, Clock, UserCircle2, BrainCircuit, Pencil, Users, Briefcase, X, Save, Edit3 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

interface ShiftsClientProps {
  shifts: any[];
  initialAssignments: any[];
  branches: any[];
  teams: any[];
  isAdmin: boolean;
}

export function ShiftsClient({ shifts, initialAssignments, branches, teams, isAdmin }: ShiftsClientProps) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAssign, setNewAssign] = useState({ userId: '', shiftId: '', teamId: '', workNote: '', roleOnShift: '', customTime: '' });
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  const utils = trpc.useUtils();
  const { data: assignments, isLoading: assignLoading } = trpc.shifts.getAssignments.useQuery(
    { date: selectedDate },
    { initialData: initialAssignments, enabled: isAdmin }
  );
  const { data: teamsData } = trpc.shifts.getTeams.useQuery(undefined, { initialData: teams, enabled: isAdmin });

  const teamList = teamsData || teams || [];

  const assignShift = trpc.shifts.assignShift.useMutation({
    onSuccess: () => {
      utils.shifts.getAssignments.invalidate();
      setShowAssignForm(false);
      setNewAssign({ userId: '', shiftId: '', teamId: '', workNote: '', roleOnShift: '', customTime: '' });
      toast.success('Personnel Assigned', 'Shift roster assignment saved successfully.');
    },
    onError: (err: any) => {
      toast.error('Assignment Failed', err?.message || 'An error occurred.');
    },
  });

  const updateAssignment = trpc.shifts.updateAssignment.useMutation({
    onSuccess: () => {
      utils.shifts.getAssignments.invalidate();
      setEditingAssignment(null);
      toast.success('Assignment Updated', 'Personnel shift details updated successfully.');
    },
    onError: (err: any) => {
      toast.error('Update Failed', err?.message || 'An error occurred.');
    },
  });

  const removeAssignment = trpc.shifts.removeAssignment.useMutation({
    onSuccess: () => {
      utils.shifts.getAssignments.invalidate();
      toast.success('Assignment Removed', 'Personnel removed from shift roster.');
    },
  });

  const autoGenerate = trpc.shifts.autoGenerateRoster.useMutation({
    onSuccess: (res: any) => {
      utils.shifts.getAssignments.invalidate();
      toast.success('Roster Auto-Generated', `Assigned ${res.assigned || 0} employees.`);
    },
  });

  const createShift = trpc.shifts.createShift.useMutation({
    onSuccess: () => { utils.invalidate('shifts'); setShowShiftEditor(false); toast.success('Shift Created', 'New shift block configured.'); },
  });
  const updateShift = trpc.shifts.updateShift.useMutation({
    onSuccess: () => { utils.invalidate('shifts'); setEditingShiftId(null); toast.success('Shift Updated', 'Shift details updated.'); },
  });
  const deleteShift = trpc.shifts.deleteShift.useMutation({
    onSuccess: () => { utils.invalidate('shifts'); toast.success('Shift Deleted', 'Shift block removed.'); },
  });
  const createTeam = trpc.shifts.createTeam.useMutation({
    onSuccess: () => { utils.shifts.getTeams.invalidate(); setTeamDraft({ name: '', description: '' }); toast.success('Team Created'); },
  });
  const deleteTeam = trpc.shifts.deleteTeam.useMutation({
    onSuccess: () => { utils.shifts.getTeams.invalidate(); toast.success('Team Removed'); },
  });

  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftDraft, setShiftDraft] = useState({
    id: '', name: '', startTime: '09:00', endTime: '17:00', location: '', graceMinutes: 10, breakMinutes: 60, isNightShift: false, recurringDays: [] as number[], branchId: '',
  });
  const [teamDraft, setTeamDraft] = useState({ name: '', description: '' });

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
      recurringDays: shift?.recurringDays || [],
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

  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin && (showAssignForm || showTeamPanel || Boolean(editingAssignment)) });

  const assignmentList = isAdmin ? (assignments || []) : initialAssignments;

  const groupedAssignments: Record<string, any[]> = {};
  shifts.forEach((s: any) => {
    groupedAssignments[s.id] = assignmentList.filter((a: any) => a.shiftId === s.id) || [];
  });

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">{/* @ts-ignore */}<T>Shift Roster & Scheduling</T></h1>
            <p className="page-subtitle">{/* @ts-ignore */}<T>Configure employee shift timing, team rosters, and custom schedules.</T></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto font-mono text-sm font-semibold"
          />
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
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
                <Plus className="h-4 w-4" /> {/* @ts-ignore */}<T>Assign Shift</T></Button>
              <Button variant="outline" size="sm" onClick={() => setShowTeamPanel((s) => !s)}>
                <Users className="h-4 w-4" /> {/* @ts-ignore */}<T>Teams</T></Button>
              <Button variant="outline" size="sm" onClick={() => { setShowShiftEditor((s) => !s); if (!showShiftEditor) { setEditingShiftId(null); setShiftDraft({ id: '', name: '', startTime: '09:00', endTime: '17:00', location: '', graceMinutes: 10, breakMinutes: 60, isNightShift: false, recurringDays: [], branchId: '' }); } }}>
                <CalendarRange className="h-4 w-4" /> {showShiftEditor ? 'Close Editor' : 'New Shift'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showTeamPanel && isAdmin && (
        <Card className="animate-scale-in border-[var(--brand)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Teams</T></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid grid-cols-1 items-end gap-4 md:grid-cols-3"
              onSubmit={(e) => { e.preventDefault(); if (teamDraft.name) createTeam.mutate({ ...teamDraft, memberIds: [] }); }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Team Name</T></label>
                <Input value={teamDraft.name} onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })} placeholder="e.g. Assembly Line A" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Description</T></label>
                <Input value={teamDraft.description} onChange={(e) => setTeamDraft({ ...teamDraft, description: e.target.value })} placeholder="Short description" />
              </div>
              <Button type="submit" disabled={createTeam.isPending || !teamDraft.name}>{/* @ts-ignore */}<T>Create Team</T></Button>
            </form>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamList.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>No teams yet. Create one above.</T></p>
              ) : teamList.map((tm: any) => (
                <div key={tm.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-main)]">{tm.name}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{tm.description || 'No description'}</p>
                    <p className="mt-1 text-[10px] uppercase text-[var(--text-muted)]">{tm._count?.members ?? tm.memberIds?.length ?? 0} {/* @ts-ignore */}<T>members</T></p>
                  </div>
                  <button onClick={() => deleteTeam.mutate({ id: tm.id })} className="text-[var(--text-muted)] transition-colors hover:text-[var(--rose)]" aria-label="Delete team">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showAssignForm && isAdmin && (
        <Card className="animate-scale-in border-[var(--brand)]/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Assign Personnel Shift &amp; Custom Timings</T></CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAssign.shiftId || (!newAssign.userId && !newAssign.teamId)) return;
                const finalRole = newAssign.customTime
                  ? `${newAssign.roleOnShift || 'Staff'} (${newAssign.customTime})`.trim()
                  : newAssign.roleOnShift;
                assignShift.mutate({
                  userId: newAssign.userId,
                  shiftId: newAssign.shiftId,
                  teamId: newAssign.teamId,
                  workNote: newAssign.workNote,
                  roleOnShift: finalRole,
                  date: selectedDate,
                });
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Target Shift Block</T></label>
                <select required className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={newAssign.shiftId} onChange={(e) => setNewAssign({ ...newAssign, shiftId: e.target.value })}>
                  <option value="">{/* @ts-ignore */}<T>-- Select Shift Block --</T></option>
                  {shifts.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Select Personnel</T></label>
                <select className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={newAssign.userId} onChange={(e) => setNewAssign({ ...newAssign, userId: e.target.value, teamId: e.target.value ? '' : newAssign.teamId })}>
                  <option value="">{/* @ts-ignore */}<T>-- Browse Directory --</T></option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} - {u.designation || u.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Or Assign Entire Team</T></label>
                <select className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={newAssign.teamId} onChange={(e) => setNewAssign({ ...newAssign, teamId: e.target.value, userId: e.target.value ? '' : newAssign.userId })}>
                  <option value="">{/* @ts-ignore */}<T>— No team —</T></option>
                  {teamList.map((tm: any) => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Custom Timing Override (Optional)</T></label>
                <Input value={newAssign.customTime} onChange={(e) => setNewAssign({ ...newAssign, customTime: e.target.value })} placeholder="e.g. 08:30 - 16:30" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Role on Shift</T></label>
                <Input value={newAssign.roleOnShift} onChange={(e) => setNewAssign({ ...newAssign, roleOnShift: e.target.value })} placeholder="e.g. Shift Lead / Operator" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Assigned Work Note</T></label>
                <Input value={newAssign.workNote} onChange={(e) => setNewAssign({ ...newAssign, workNote: e.target.value })} placeholder="Work instructions / tasks" />
              </div>

              <div className="flex items-end md:col-span-3 justify-end">
                <Button type="submit" disabled={assignShift.isPending || !newAssign.shiftId || (!newAssign.userId && !newAssign.teamId)}>
                  {assignShift.isPending ? 'Saving Assignment...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showShiftEditor && isAdmin && (
        <Card className="animate-scale-in border-[var(--brand)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-[var(--brand-strong)]" /> {editingShiftId ? 'Edit Shift Block' : 'Create Shift Block'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Name</T></label>
                <Input value={shiftDraft.name} onChange={(e) => setShiftDraft({ ...shiftDraft, name: e.target.value })} placeholder="e.g. Morning Shift" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Start Time</T></label>
                <Input type="time" value={shiftDraft.startTime} onChange={(e) => setShiftDraft({ ...shiftDraft, startTime: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>End Time</T></label>
                <Input type="time" value={shiftDraft.endTime} onChange={(e) => setShiftDraft({ ...shiftDraft, endTime: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Location</T></label>
                <Input value={shiftDraft.location} onChange={(e) => setShiftDraft({ ...shiftDraft, location: e.target.value })} placeholder="e.g. HQ Building" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Grace (min)</T></label>
                <Input type="number" value={shiftDraft.graceMinutes} onChange={(e) => setShiftDraft({ ...shiftDraft, graceMinutes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Break (min)</T></label>
                <Input type="number" value={shiftDraft.breakMinutes} onChange={(e) => setShiftDraft({ ...shiftDraft, breakMinutes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Branch</T></label>
                <select value={shiftDraft.branchId} onChange={(e) => setShiftDraft({ ...shiftDraft, branchId: e.target.value })} className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">{/* @ts-ignore */}<T>— No branch —</T></option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <input type="checkbox" checked={shiftDraft.isNightShift} onChange={(e) => setShiftDraft({ ...shiftDraft, isNightShift: e.target.checked })} />
                  {/* @ts-ignore */}<T>Night shift (night differential)</T></label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setShiftDraft((prev) => ({
                        ...prev,
                        recurringDays: prev.recurringDays.includes(i)
                          ? prev.recurringDays.filter((x) => x !== i)
                          : [...prev.recurringDays, i],
                      }))}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${shiftDraft.recurringDays.includes(i) ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowShiftEditor(false); setEditingShiftId(null); }}>{/* @ts-ignore */}<T>Cancel</T></Button>
              <Button onClick={saveShift} disabled={createShift.isPending || updateShift.isPending || !shiftDraft.name}>{editingShiftId ? 'Save Changes' : 'Create Shift'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roster Shift Display */}
      <div className="space-y-8">
        {(assignLoading && isAdmin) ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">{/* @ts-ignore */}<T>Loading roster...</T></div>
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
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {shift.startTime} - {shift.endTime} • {shift.location || 'HQ Building'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[9px] uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Grace</T> {shift.graceMinutes ?? 10}{/* @ts-ignore */}<T>m</T></span>
                        <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[9px] uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Break</T> {shift.breakMinutes ?? 60}{/* @ts-ignore */}<T>m</T></span>
                        {shift.isNightShift && <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[9px] uppercase text-[var(--brand-strong)]">{/* @ts-ignore */}<T>Night</T></span>}
                        {shift.recurringDays?.length > 0 && <span className="rounded-full bg-[var(--sky-soft)] px-2 py-0.5 text-[9px] uppercase text-[var(--sky)]">{/* @ts-ignore */}<T>Recurring</T> {shift.recurringDays.map((d: number) => WEEKDAYS[d]).join('/')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewAssign({ ...newAssign, shiftId: shift.id });
                            setShowAssignForm(true);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                          className="text-xs gap-1 border-[var(--brand)]/40 text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Person
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditor(shift)} aria-label="Edit shift">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteShift.mutate({ id: shift.id })} aria-label="Delete shift" className="hover:text-[var(--rose)]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-2 text-center">
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Headcount</T></p>
                      <p className="text-lg font-bold text-[var(--text-main)]">{shiftAssignments.length}</p>
                    </div>
                  </div>
                </div>

                <CardContent>
                  {shiftAssignments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                      {/* @ts-ignore */}<T>No personnel assigned to this shift block.</T></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {shiftAssignments.map((assignment: any) => (
                        <div
                          key={assignment.id}
                          className="group/card flex flex-col gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 transition-all hover:border-[var(--brand)]/40 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar src={assignment.userAvatar} name={assignment.userName} size="md" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--text-main)]">{assignment.userName}</p>
                                <p className="truncate text-xs text-[var(--brand-strong)] font-medium">{assignment.roleOnShift || assignment.userRole || 'Staff'}</p>
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingAssignment(assignment)}
                                  className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-panel)] hover:text-[var(--brand)]"
                                  title="Edit Shift Timing / Details"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => removeAssignment.mutate({ id: assignment.id })}
                                  className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-panel)] hover:text-[var(--rose)]"
                                  title="Remove Assignment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {assignment.teamName && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--brand-strong)]">
                              <Users className="h-3 w-3" /> {assignment.teamName}
                            </span>
                          )}

                          {assignment.workNote && (
                            <p className="flex items-start gap-1.5 rounded-xl bg-[var(--bg-panel)] p-2.5 text-xs text-[var(--text-muted)]">
                              <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" /> {assignment.workNote}
                            </p>
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
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">{/* @ts-ignore */}<T>No shifts configured in the system.</T></h3>
          </div>
        )}
      </div>

      {/* Modal to Edit Personnel Shift Details */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditingAssignment(null)}>
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-3">
                <Avatar src={editingAssignment.userAvatar} name={editingAssignment.userName} size="md" />
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)]">Edit Shift Assignment</h3>
                  <p className="text-xs text-[var(--text-muted)]">{editingAssignment.userName}</p>
                </div>
              </div>
              <button onClick={() => setEditingAssignment(null)} className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
                <X size={18} />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateAssignment.mutate({
                  id: editingAssignment.id,
                  shiftId: editingAssignment.shiftId,
                  roleOnShift: editingAssignment.roleOnShift,
                  workNote: editingAssignment.workNote,
                  teamId: editingAssignment.teamId,
                });
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Target Shift Block</label>
                <select
                  value={editingAssignment.shiftId}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, shiftId: e.target.value })}
                  className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  {shifts.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Shift Role / Custom Timing Override</label>
                <Input
                  value={editingAssignment.roleOnShift || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, roleOnShift: e.target.value })}
                  placeholder="e.g. Lead Operator (08:30 - 16:30)"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Assigned Work / Task Note</label>
                <Input
                  value={editingAssignment.workNote || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, workNote: e.target.value })}
                  placeholder="e.g. Main assembly line oversight"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Team Assignment</label>
                <select
                  value={editingAssignment.teamId || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, teamId: e.target.value || null })}
                  className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— No team —</option>
                  {teamList.map((tm: any) => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingAssignment(null)}>Cancel</Button>
                <Button type="submit" disabled={updateAssignment.isPending}>
                  {updateAssignment.isPending ? 'Saving...' : 'Save Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
