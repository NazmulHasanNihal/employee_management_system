"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, Users, Building, MapPin } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function CalendarPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';
  
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("General");

  const { data: events, isLoading } = trpc.calendar.getEvents.useQuery();
  const utils = trpc.useUtils();
  
  const createEvent = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setShowAdd(false);
      setTitle("");
      setDescription("");
      setDate("");
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    createEvent.mutate({ title, description, date: new Date(date).toISOString(), type });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-200 text-transparent bg-clip-text flex items-center gap-3">
            <CalendarIcon className="text-[var(--ledger-blue)]" size={32} />
            Company Calendar
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)]">
            Holidays, Paydays, and Company-wide events.
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="mt-4 md:mt-0 bg-[var(--ledger-blue)] text-black px-4 py-2 rounded-lg font-bold font-mono uppercase tracking-widest hover:brightness-110 flex items-center gap-2"
          >
            <Plus size={16} /> Add Event
          </button>
        )}
      </div>

      {showAdd && isAdmin && (
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Title</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[var(--ledger-blue)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Date</label>
                <input 
                  type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[var(--ledger-blue)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Type</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[var(--ledger-blue)] focus:outline-none"
                >
                  <option value="Holiday">Holiday</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Social">Social</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Description (Optional)</label>
              <input 
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[var(--ledger-blue)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-[var(--text-muted)] hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={createEvent.isPending} className="bg-[var(--ledger-blue)] text-black px-6 py-2 rounded-lg font-bold">Save Event</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm animate-pulse">Loading events...</div>
      ) : (
        <div className="space-y-4">
          {events?.map((evt: any) => {
            const isHoliday = evt.type === 'Holiday';
            const isPayroll = evt.type === 'Payroll';
            return (
              <div key={evt.id} className="ledger-panel p-5 border border-white/10 bg-white/5 rounded-xl flex justify-between items-center hover:border-white/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center border ${
                    isHoliday ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    isPayroll ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                    'bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]/30 text-[var(--ledger-blue)]'
                  }`}>
                    <span className="text-xs font-mono font-bold uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-black">{new Date(evt.date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {evt.title}
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                        isHoliday ? 'text-emerald-400 border-emerald-400/20' :
                        isPayroll ? 'text-purple-400 border-purple-400/20' :
                        'text-[var(--text-muted)] border-white/10'
                      }`}>
                        {evt.type}
                      </span>
                    </h3>
                    {evt.description && <p className="text-sm text-[var(--text-muted)] mt-1">{evt.description}</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {events?.length === 0 && (
            <div className="text-center text-[var(--text-muted)] py-12 font-mono text-sm border border-dashed border-white/10 rounded-xl">
              No upcoming events found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
