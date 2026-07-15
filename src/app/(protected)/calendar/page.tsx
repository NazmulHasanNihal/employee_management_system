"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Plus, Clock, Users, 
  CalendarDays, Wallet, Hash, Filter, X,
  Download, RefreshCw, CalendarCheck2, Check
} from 'lucide-react';
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
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // Interactive Day Filtering
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  // Dynamic Calendar Logic
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  // Calculate Next Payday
  const nextPayday = useMemo(() => {
    if (!events) return null;
    const futurePayrolls = events
      .filter(e => e.type === 'Payroll' && new Date(e.date) >= new Date(currentYear, currentMonth, todayDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (futurePayrolls.length > 0) {
      const paydayDate = new Date(futurePayrolls[0].date);
      const diffTime = Math.abs(paydayDate.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  }, [events, currentYear, currentMonth, todayDate, now]);

  // Filter Events (by Type AND selected Day)
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events;
    
    if (filterType) {
      result = result.filter(e => e.type === filterType);
    }
    
    if (selectedDay) {
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }
    
    // Sort chronologically
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, filterType, selectedDay, currentMonth, currentYear]);

  if (isLoading) return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase">Syncing Calendar Data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 to-[var(--ledger-blue)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <CalendarDays className="text-[var(--ledger-blue)]" size={36} />
            Company Calendar
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Holidays, Payroll, and Organizational Events.
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors uppercase tracking-widest">
            <RefreshCw size={14} /> Sync
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors uppercase tracking-widest hidden md:flex">
            <Download size={14} /> Export ICS
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="bg-[var(--ledger-blue)] text-black px-6 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all flex items-center gap-2"
            >
              {showAdd ? <X size={16} /> : <Plus size={16} />}
              {showAdd ? 'Close' : 'Add Event'}
            </button>
          )}
        </div>
      </div>

      {/* Add Event Modal / Dropdown */}
      {showAdd && isAdmin && (
        <div className="bg-white/5 backdrop-blur-xl border border-[var(--ledger-blue)]/50 shadow-[0_0_30px_rgba(0,195,255,0.1)] rounded-3xl p-8 animate-in slide-in-from-top-4 relative z-20">
          <h3 className="text-white font-mono font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Plus size={18} className="text-[var(--ledger-blue)]" /> Create Schedule Entry
          </h3>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Event Title</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
                  placeholder="E.g., Q3 Planning"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Date</label>
                <input 
                  type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors appearance-none"
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
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Description (Optional)</label>
              <input 
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
                placeholder="Additional details..."
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-[var(--verify-green)] text-black px-8 py-3 rounded-xl font-bold font-mono text-sm uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,100,0.3)] transition-all flex items-center gap-2">
                <Check size={18} /> Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Visual Calendar */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden relative shadow-2xl flex-1 flex flex-col">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-2xl font-bold text-white tracking-tight">{monthName} {currentYear}</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white hover:border-[var(--ledger-blue)] transition-colors">Prev</button>
                <button className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-[var(--text-muted)] cursor-not-allowed">Next</button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 relative z-10 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3 relative z-10 flex-1">
              {daysArray.map((day, i) => {
                if (!day) return <div key={i} className="opacity-0 pointer-events-none" />;

                const isToday = day === todayDate;
                const isSelected = day === selectedDay;
                
                // Find all events for this specific day
                const dayEvents = events?.filter(e => {
                  const d = new Date(e.date);
                  return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                return (
                  <button 
                    key={i}
                    onClick={() => setSelectedDay(isSelected ? null : day)} 
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group ${
                    isSelected ? 'bg-[var(--ledger-blue)]/20 border-2 border-[var(--ledger-blue)] shadow-[0_0_15px_rgba(0,195,255,0.2)]' :
                    isToday ? 'bg-white/10 border-2 border-white text-white font-bold' : 
                    'bg-black/40 border border-white/5 hover:border-[var(--ledger-blue)]/50 hover:bg-[var(--ledger-blue)]/10 text-[var(--text-muted)] hover:text-white'
                  }`}>
                    <span className="text-lg">{day}</span>
                    
                    {/* Dynamic Event Dots mapped from DB */}
                    {dayEvents && dayEvents.length > 0 && (
                      <div className="absolute bottom-2 flex flex-wrap justify-center gap-1 max-w-[80%]">
                        {dayEvents.map(evt => (
                          <div 
                            key={evt.id} 
                            title={evt.title}
                            className={`w-1.5 h-1.5 rounded-full ${
                              evt.type === 'Holiday' ? 'bg-[var(--signal-amber)] shadow-[0_0_5px_var(--signal-amber)]' :
                              evt.type === 'Payroll' ? 'bg-[var(--verify-green)] shadow-[0_0_5px_var(--verify-green)]' :
                              evt.type === 'Meeting' ? 'bg-purple-400 shadow-[0_0_5px_rgba(168,85,247,1)]' :
                              'bg-[var(--ledger-blue)] shadow-[0_0_5px_rgba(0,195,255,1)]'
                            }`} 
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Widgets & List */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          
          {/* Next Payday Widget */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl overflow-hidden group hover:border-[var(--verify-green)]/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
              <Wallet size={14} className="text-[var(--verify-green)]" /> Next Payroll
            </h4>
            <div className="flex items-end gap-3 relative z-10">
              {nextPayday !== null ? (
                <>
                  <span className="text-4xl font-mono font-black text-white">{nextPayday}</span>
                  <span className="text-sm font-mono text-[var(--text-muted)] uppercase mb-1">Days</span>
                </>
              ) : (
                <span className="text-sm font-mono text-[var(--text-muted)] uppercase">No upcoming payroll</span>
              )}
            </div>
          </div>

          {/* Filters Widget */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} className="text-[var(--ledger-blue)]" /> Quick Filters
            </h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilterType(null)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterType === null ? 'bg-white text-black border-white' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType('Holiday')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterType === 'Holiday' ? 'bg-[var(--signal-amber)] text-black border-[var(--signal-amber)] shadow-[0_0_10px_var(--signal-amber)]' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}
              >
                Holidays
              </button>
              <button 
                onClick={() => setFilterType('Payroll')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterType === 'Payroll' ? 'bg-[var(--verify-green)] text-black border-[var(--verify-green)] shadow-[0_0_10px_var(--verify-green)]' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}
              >
                Payroll
              </button>
              <button 
                onClick={() => setFilterType('Meeting')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterType === 'Meeting' ? 'bg-purple-500 text-black border-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}
              >
                Meetings
              </button>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <CalendarCheck2 size={14} className="text-[var(--text-muted)]" /> 
                {selectedDay ? `${monthName} ${selectedDay}` : 'Upcoming Schedule'}
              </h4>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="text-[10px] font-mono text-[var(--ledger-blue)] hover:underline uppercase tracking-widest">
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {filteredEvents?.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest border border-dashed border-white/10 rounded-2xl bg-black/20">
                  {selectedDay ? "No events scheduled for this date." : "No events found"}
                </div>
              ) : (
                filteredEvents?.map(event => (
                  <div key={event.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all group flex items-start gap-4">
                    
                    {/* Icon Base on Type */}
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-1 border ${
                      event.type === 'Holiday' ? 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30' :
                      event.type === 'Payroll' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30' :
                      event.type === 'Meeting' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      'bg-[var(--ledger-blue)]/10 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/30'
                    }`}>
                      {event.type === 'Holiday' ? <CalendarDays size={18} /> :
                       event.type === 'Payroll' ? <Wallet size={18} /> :
                       event.type === 'Meeting' ? <Users size={18} /> :
                       <Hash size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-white text-sm truncate">{event.title}</h5>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mt-1 tracking-widest">
                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      {event.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed font-sans">
                          {event.description}
                        </p>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
