"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { 
  CalendarRange, Plus, Trash2, CalendarDays, Zap, 
  Clock, MapPin, Search, ChevronRight, UserCircle2, BrainCircuit
} from 'lucide-react';

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
      setNewAssign({ userId: '', shiftId: '' });
    }
  });

  const removeAssignment = trpc.shifts.removeAssignment.useMutation({
    onSuccess: () => utils.shifts.getAssignments.invalidate()
  });

  const autoGenerate = trpc.shifts.autoGenerateRoster.useMutation({
    onSuccess: (data) => {
      utils.shifts.getAssignments.invalidate();
    }
  });

  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin && showAssignForm });

  if (shiftsLoading || assignLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Loading AI Roster...</div>;
  }

  // Group assignments by Shift for rendering the grid
  const groupedAssignments: Record<string, any[]> = {};
  shifts?.forEach((s: any) => {
    groupedAssignments[s.id] = assignments?.filter((a: any) => a.shiftId === s.id) || [];
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/10 to-[var(--ledger-blue)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <CalendarRange className="text-orange-400" size={36} />
            Shift Roster
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Intelligent Workforce Scheduling & Assignment.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6 md:mt-0">
          <div className="relative group">
            <input 
              type="date" 
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-black/50 border border-white/10 p-3 rounded-xl text-sm font-mono text-white focus:border-orange-500 outline-none transition-colors"
            />
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={() => autoGenerate.mutate({ startDate: selectedDate })} 
                disabled={autoGenerate.isPending} 
                className="bg-gradient-to-r from-[#9b59b6] to-purple-600 text-white px-5 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(155,89,182,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {autoGenerate.isPending ? <BrainCircuit size={16} className="animate-pulse" /> : <Zap size={16} />}
                {autoGenerate.isPending ? 'AI Computing...' : 'Auto-Fill Roster'}
              </button>
              <button 
                onClick={() => setShowAssignForm(!showAssignForm)} 
                className="bg-white/10 border border-white/20 text-white px-4 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Assign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Assignment Modal (Admin) */}
      {showAssignForm && isAdmin && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl animate-in slide-in-from-top-4 z-20">
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <UserCircle2 size={14} className="text-orange-400" /> Manual Shift Override
          </h4>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" onSubmit={e => { e.preventDefault(); assignShift.mutate({ ...newAssign, date: selectedDate }); }}>
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Select Personnel</label>
              <select 
                required value={newAssign.userId} onChange={e => setNewAssign({...newAssign, userId: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none transition-colors appearance-none"
              >
                <option value="">-- Browse Directory --</option>
                {users?.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} - {u.designation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Target Shift</label>
              <select 
                required value={newAssign.shiftId} onChange={e => setNewAssign({...newAssign, shiftId: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none transition-colors appearance-none"
              >
                <option value="">-- Select Block --</option>
                {shifts?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                ))}
              </select>
            </div>
            <button 
              disabled={assignShift.isPending || !newAssign.userId || !newAssign.shiftId} 
              type="submit" 
              className="bg-orange-500 text-black px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all disabled:opacity-50"
            >
              Confirm Override
            </button>
          </form>
        </div>
      )}

      {/* Roster Grid View */}
      <div className="space-y-8">
        {shifts?.map((shift: any) => {
          const shiftAssignments = groupedAssignments[shift.id] || [];
          
          return (
            <div key={shift.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl group">
              
              {/* Shift Header */}
              <div className="bg-black/40 border-b border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{shift.name}</h3>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">
                      {shift.startTime} - {shift.endTime} • HQ Building
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Headcount</span>
                    <span className="text-lg font-bold text-white font-mono">{shiftAssignments.length}</span>
                  </div>
                </div>
              </div>

              {/* Assignments Grid */}
              <div className="p-6">
                {shiftAssignments.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest border border-dashed border-white/10 rounded-2xl bg-black/20">
                    No personnel assigned to this block.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {shiftAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/card hover:border-[var(--ledger-blue)]/50 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {assignment.userAvatar ? (
                            <Image src={assignment.userAvatar} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt="avatar" width={40} height={40} />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--ledger-blue)]/20 border border-[var(--ledger-blue)]/30 text-[var(--ledger-blue)] flex items-center justify-center font-bold text-sm">
                              {assignment.userName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-bold text-sm text-white truncate">{assignment.userName}</p>
                            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest truncate">{assignment.userRole || 'Staff'}</p>
                          </div>
                        </div>
                        
                        {isAdmin && (
                          <button 
                            onClick={() => removeAssignment.mutate({ id: assignment.id })}
                            className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-all p-2 rounded-lg hover:bg-red-500/10"
                            title="Remove Assignment"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {(!shifts || shifts.length === 0) && (
           <div className="p-12 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest border border-dashed border-white/10 rounded-3xl bg-black/20">
             No shifts configured in the system.
           </div>
        )}
      </div>

    </div>
  );
}
