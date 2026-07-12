"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { CalendarRange, Plus, Trash2, CalendarDays, Zap } from 'lucide-react';

export default function ShiftsPage() {
  const { data: session } = authClient.useSession();
  const utils = trpc.useUtils();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'HR Manager';
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAssign, setNewAssign] = useState({ userId: '', shiftId: '' });

  const { data: shifts, isLoading: shiftsLoading } = trpc.shifts.getShifts.useQuery();
  const { data: assignments, isLoading: assignLoading } = trpc.shifts.getAssignments.useQuery({ date: selectedDate });
  
  const assignShift = trpc.shifts.assignShift.useMutation({
    onSuccess: () => {
      utils.shifts.getAssignments.invalidate();
      setShowAssignForm(false);
    }
  });

  const removeAssignment = trpc.shifts.removeAssignment.useMutation({
    onSuccess: () => utils.shifts.getAssignments.invalidate()
  });

  const autoGenerate = trpc.shifts.autoGenerateRoster.useMutation({
    onSuccess: (data) => {
      utils.shifts.getAssignments.invalidate();
      alert(`Successfully auto-generated ${data.count} shift assignments!`);
    }
  });

  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin && showAssignForm });

  if (shiftsLoading) return <div className="p-8 text-center ledger-muted animate-pulse">Loading Roster...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border shrink-0">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text flex items-center gap-2">
            <CalendarRange size={24} className="text-[var(--ledger-blue)]" /> Shift Roster
          </h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            Workforce Scheduling & Assignments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]"
          />
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => autoGenerate.mutate({ startDate: selectedDate })} disabled={autoGenerate.isPending} className="bg-[#9b59b6] text-white px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-2">
                <Zap size={14} /> {autoGenerate.isPending ? 'Calculating...' : 'Auto-Fill Roster'}
              </button>
              <button onClick={() => setShowAssignForm(!showAssignForm)} className="bg-[var(--ledger-blue)] text-black px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2">
                <Plus size={14} /> Assign Shift
              </button>
            </div>
          )}
        </div>
      </div>

      {showAssignForm && isAdmin && (
        <div className="ledger-panel p-4 bg-[var(--bg-panel)] mb-6">
          <form className="flex flex-col md:flex-row gap-4" onSubmit={e => { e.preventDefault(); assignShift.mutate({ ...newAssign, date: selectedDate }); }}>
            <select 
              required value={newAssign.userId} onChange={e => setNewAssign({...newAssign, userId: e.target.value})}
              className="flex-1 bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]"
            >
              <option value="">Select Employee...</option>
              {users?.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </select>
            <select 
              required value={newAssign.shiftId} onChange={e => setNewAssign({...newAssign, shiftId: e.target.value})}
              className="flex-1 bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]"
            >
              <option value="">Select Shift...</option>
              {shifts?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
              ))}
            </select>
            <button disabled={assignShift.isPending} type="submit" className="bg-[var(--ledger-blue)] text-black px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors">
              Confirm Assignment
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar">
        {assignLoading ? (
          <div className="p-8 text-center ledger-muted animate-pulse">Fetching Assignments...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts?.map((shift: any) => {
              const shiftAssignments = assignments?.filter((a: any) => a.shiftId === shift.id) || [];
              return (
                <div key={shift.id} className="ledger-panel p-0 overflow-hidden flex flex-col">
                  <div className="p-3 border-b ledger-border bg-[var(--bg-void)] flex justify-between items-center">
                    <h3 className="font-mono font-bold uppercase text-[var(--ledger-blue)] flex items-center gap-2">
                      <CalendarDays size={16} /> {shift.name}
                    </h3>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="p-4 flex-1 space-y-2 bg-[var(--bg-panel)]">
                    {shiftAssignments.length === 0 && (
                      <p className="text-[10px] font-mono text-[var(--text-muted)] text-center py-4">No employees assigned</p>
                    )}
                    {shiftAssignments.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center p-2 border ledger-border bg-[var(--bg-void)]">
                        <div>
                          <p className="text-xs font-mono font-bold uppercase">{a.user.name}</p>
                          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase">{a.user.department}</p>
                        </div>
                        {isAdmin && (
                          <button onClick={() => removeAssignment.mutate({ assignmentId: a.id })} className="text-[var(--text-muted)] hover:text-[var(--alert-red)] transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
