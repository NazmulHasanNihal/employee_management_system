"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Plus, Clock, Users, 
  CalendarDays, Wallet, Hash, Filter, X,
  Download, RefreshCw, CalendarCheck2, Check,
  ChevronLeft, ChevronRight, Target, Bell, Trash2,
  Edit3, UserPlus, ListTodo, LayoutGrid, List, AlertTriangle
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

type ViewMode = 'month' | 'week' | 'agenda';
type EventType = 'Holiday' | 'Meeting' | 'Payroll' | 'Task' | 'Reminder' | 'Social' | 'General';

const EVENT_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  Holiday: { color: 'text-[var(--signal-amber)]', bg: 'bg-[var(--signal-amber)]/10', border: 'border-[var(--signal-amber)]/30', icon: CalendarDays },
  Meeting: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Users },
  Payroll: { color: 'text-[var(--verify-green)]', bg: 'bg-[var(--verify-green)]/10', border: 'border-[var(--verify-green)]/30', icon: Wallet },
  Task: { color: 'text-[var(--ledger-blue)]', bg: 'bg-[var(--ledger-blue)]/10', border: 'border-[var(--ledger-blue)]/30', icon: Target },
  Reminder: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Bell },
  Social: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: Users },
  General: { color: 'text-white', bg: 'bg-white/5', border: 'border-white/10', icon: Hash },
};

const STATUS_COLORS: Record<string, string> = {
  Pending: 'text-[var(--signal-amber)] bg-[var(--signal-amber)]/10',
  InProgress: 'text-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10',
  Done: 'text-[var(--verify-green)] bg-[var(--verify-green)]/10',
  Cancelled: 'text-red-400 bg-red-500/10',
};

export default function CalendarPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';
  const isManager = user?.role === 'Manager' || isAdmin;
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Form state
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [status, setStatus] = useState("Pending");
  const [assigneeId, setAssigneeId] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState(30);

  // Data
  const { data: events, isLoading } = trpc.calendar.getEvents.useQuery();
  const { data: teamData } = trpc.team.getMyTeam.useQuery();
  const { data: departments } = trpc.departments.getDepartments.useQuery();

  const createEvent = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      setShowAdd(false);
      setTitle(""); setDescription(""); setDate(""); setEndDate(""); setAssigneeId(""); setTargetTeam("");
      window.location.reload();
    }
  });

  const updateEventMutation = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => window.location.reload()
  });

  const deleteEventMutation = trpc.calendar.deleteEvent.useMutation({
    onSuccess: () => window.location.reload()
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    createEvent.mutate({ 
      title, description, 
      date: new Date(date).toISOString(), 
      endDate: endDate ? new Date(endDate).toISOString() : null,
      type, status, 
      assigneeId: assigneeId || null, 
      targetTeam: targetTeam || null,
      reminderMinutes 
    });
  };

  const handleStatusChange = (eventId: string, newStatus: string) => {
    updateEventMutation.mutate({ id: eventId, status: newStatus });
  };

  const handleDelete = (eventId: string) => {
    if (confirm('Delete this event?')) {
      deleteEventMutation.mutate({ id: eventId });
    }
  };

  // Calendar computation
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const todayDate = new Date().getDate();
  const todayMonth = new Date().getMonth();
  const todayYear = new Date().getFullYear();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum > 0 && dayNum <= daysInMonth ? dayNum : null;
  });

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events as any[];
    
    if (filterType) result = result.filter(e => e.type === filterType);
    if (filterStatus) result = result.filter(e => e.status === filterStatus);
    if (selectedDay) {
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }
    
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, filterType, filterStatus, selectedDay, currentMonth, currentYear]);

  // Week view data
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Next Payday
  const nextPayday = useMemo(() => {
    if (!events) return null;
    const futurePayrolls = (events as any[])
      .filter(e => e.type === 'Payroll' && new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (futurePayrolls.length > 0) {
      const paydayDate = new Date(futurePayrolls[0].date);
      const diffDays = Math.ceil((paydayDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  }, [events]);

  // Upcoming tasks assigned to me
  const myUpcomingTasks = useMemo(() => {
    if (!events || !user) return [];
    return (events as any[]).filter(e => 
      (e.assigneeId === user.id || e.creatorId === user.id) && 
      e.type === 'Task' && 
      e.status !== 'Done' && 
      e.status !== 'Cancelled'
    ).slice(0, 5);
  }, [events, user]);

  const teamMembers = teamData?.directReports || [];

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
            Events, tasks, reminders, and team schedules.
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
            {[
              { id: 'month' as ViewMode, icon: LayoutGrid, label: 'Month' },
              { id: 'week' as ViewMode, icon: List, label: 'Week' },
              { id: 'agenda' as ViewMode, icon: ListTodo, label: 'Agenda' },
            ].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${viewMode === v.id ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}>
                <v.icon size={12} /> {v.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[var(--ledger-blue)] text-black px-6 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all flex items-center gap-2"
          >
            {showAdd ? <X size={16} /> : <Plus size={16} />}
            {showAdd ? 'Close' : 'Add Event'}
          </button>
        </div>
      </div>

      {/* Add Event Form */}
      {showAdd && (
        <div className="bg-white/5 backdrop-blur-xl border border-[var(--ledger-blue)]/50 shadow-[0_0_30px_rgba(0,195,255,0.1)] rounded-3xl p-8 animate-in slide-in-from-top-4 relative z-20">
          <h3 className="text-white font-mono font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Plus size={18} className="text-[var(--ledger-blue)]" /> Create Event
          </h3>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Event Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors" placeholder="E.g., Q3 Planning" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Start Date</label>
                <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">End Date (Optional)</label>
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Type</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Task', 'Meeting', 'Reminder', 'Holiday', 'Payroll', 'Social', 'General'] as EventType[]).map(t => {
                    const config = EVENT_TYPE_CONFIG[t];
                    return (
                      <button key={t} type="button" onClick={() => setType(t)} className={`py-1.5 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all border ${type === t ? `${config.bg} ${config.color} ${config.border}` : 'bg-black/30 text-[var(--text-muted)] border-white/5'}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Assign To (Optional)</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none appearance-none">
                  <option value="">No assignment</option>
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Reminder</label>
                <select value={reminderMinutes} onChange={e => setReminderMinutes(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none appearance-none">
                  <option value={0}>No reminder</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none resize-none h-20 transition-colors" placeholder="Additional details..." />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="bg-[var(--verify-green)] text-black px-8 py-3 rounded-xl font-bold font-mono text-sm uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,100,0.3)] transition-all flex items-center gap-2">
                <Check size={18} /> Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Calendar View */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Month View */}
          {viewMode === 'month' && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden relative shadow-2xl flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-white tracking-tight">{monthName} {currentYear}</h3>
                <div className="flex gap-2">
                  <button onClick={() => navigateMonth(-1)} className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white hover:border-[var(--ledger-blue)] transition-colors flex items-center gap-1">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(null); }} className="px-4 py-2 bg-[var(--ledger-blue)]/20 border border-[var(--ledger-blue)]/30 rounded-lg text-xs font-mono text-[var(--ledger-blue)] hover:bg-[var(--ledger-blue)]/30 transition-colors">
                    Today
                  </button>
                  <button onClick={() => navigateMonth(1)} className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white hover:border-[var(--ledger-blue)] transition-colors flex items-center gap-1">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 relative z-10 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-3 relative z-10 flex-1">
                {daysArray.map((day, i) => {
                  if (!day) return <div key={i} className="opacity-0 pointer-events-none" />;

                  const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                  const isSelected = day === selectedDay;
                  
                  const dayEvents = (events as any[])?.filter(e => {
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
                      
                      {dayEvents && dayEvents.length > 0 && (
                        <div className="absolute bottom-2 flex flex-wrap justify-center gap-1 max-w-[80%]">
                          {dayEvents.slice(0, 4).map((evt: any) => {
                            const config = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.General;
                            return (
                              <div key={evt.id} title={evt.title} className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor]`} />
                            );
                          })}
                          {dayEvents.length > 4 && (
                            <span className="text-[6px] font-mono text-[var(--text-muted)]">+{dayEvents.length - 4}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Week of {weekDays[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white"><ChevronLeft size={14} /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-[var(--ledger-blue)]/20 border border-[var(--ledger-blue)]/30 rounded-lg text-xs font-mono text-[var(--ledger-blue)]">Today</button>
                  <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white"><ChevronRight size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((day, i) => {
                  const isToday = day.getDate() === todayDate && day.getMonth() === todayMonth && day.getFullYear() === todayYear;
                  const dayEvents = (events as any[])?.filter(e => {
                    const d = new Date(e.date);
                    return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
                  }) || [];

                  return (
                    <div key={i} className={`rounded-2xl border p-3 min-h-[200px] ${isToday ? 'border-[var(--ledger-blue)]/50 bg-[var(--ledger-blue)]/5' : 'border-white/5 bg-black/30'}`}>
                      <div className="text-center mb-3">
                        <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase">{day.toLocaleDateString('en', { weekday: 'short' })}</p>
                        <p className={`text-lg font-mono font-bold ${isToday ? 'text-[var(--ledger-blue)]' : 'text-white'}`}>{day.getDate()}</p>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((evt: any) => {
                          const config = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.General;
                          return (
                            <div key={evt.id} className={`p-1.5 rounded-lg text-[8px] font-mono uppercase truncate ${config.bg} ${config.color} border ${config.border}`} title={evt.title}>
                              {evt.title}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agenda View */}
          {viewMode === 'agenda' && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Agenda</h3>
              <div className="space-y-3">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs uppercase">No events</div>
                ) : (
                  filteredEvents.map((event: any) => {
                    const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.General;
                    const TypeIcon = config.icon;
                    return (
                      <div key={event.id} className={`flex items-start gap-4 p-4 rounded-2xl bg-black/30 border ${config.border} hover:bg-black/50 transition-all group`}>
                        <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} shrink-0`}>
                          <TypeIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white text-sm">{event.title}</h4>
                              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mt-1">
                                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                {' · '}{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-mono uppercase px-2 py-1 rounded-full ${STATUS_COLORS[event.status] || ''}`}>
                                {event.status}
                              </span>
                              {event.assignee && (
                                <span className="text-[8px] font-mono text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded-full">
                                  → {event.assignee.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{event.description}</p>
                          )}
                          {/* Action buttons */}
                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {event.status !== 'Done' && (
                              <button onClick={() => handleStatusChange(event.id, 'Done')} className="text-[8px] font-mono text-[var(--verify-green)] hover:bg-[var(--verify-green)]/10 px-2 py-1 rounded transition-colors uppercase">✓ Done</button>
                            )}
                            {event.status === 'Pending' && (
                              <button onClick={() => handleStatusChange(event.id, 'InProgress')} className="text-[8px] font-mono text-[var(--ledger-blue)] hover:bg-[var(--ledger-blue)]/10 px-2 py-1 rounded transition-colors uppercase">▶ Start</button>
                            )}
                            <button onClick={() => handleDelete(event.id)} className="text-[8px] font-mono text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors uppercase">✕ Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Widgets */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          
          {/* Next Payday */}
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

          {/* My Tasks */}
          {myUpcomingTasks.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={14} className="text-[var(--ledger-blue)]" /> My Tasks
              </h4>
              <div className="space-y-2">
                {myUpcomingTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 bg-black/30 rounded-xl border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${task.status === 'InProgress' ? 'bg-[var(--ledger-blue)] animate-pulse' : 'bg-[var(--signal-amber)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{task.title}</p>
                      <p className="text-[8px] font-mono text-[var(--text-muted)]">
                        {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[7px] font-mono uppercase px-1.5 py-0.5 rounded ${STATUS_COLORS[task.status] || ''}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} className="text-[var(--ledger-blue)]" /> Quick Filters
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase mb-2">By Type</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterType === null ? 'bg-white text-black border-white' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}>All</button>
                  {Object.keys(EVENT_TYPE_CONFIG).map(t => {
                    const config = EVENT_TYPE_CONFIG[t];
                    return (
                      <button key={t} onClick={() => setFilterType(filterType === t ? null : t)} className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterType === t ? `${config.bg} ${config.color} border-current` : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase mb-2">By Status</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterStatus(null)} className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${!filterStatus ? 'bg-white text-black border-white' : 'bg-black/40 text-[var(--text-muted)] border-white/10'}`}>All</button>
                  {['Pending', 'InProgress', 'Done'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${filterStatus === s ? `${STATUS_COLORS[s]}` : 'bg-black/40 text-[var(--text-muted)] border-white/10'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl flex-1 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <CalendarCheck2 size={14} className="text-[var(--text-muted)]" /> 
                {selectedDay ? `${monthName} ${selectedDay}` : 'Upcoming'}
              </h4>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="text-[10px] font-mono text-[var(--ledger-blue)] hover:underline uppercase tracking-widest">Clear</button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {filteredEvents?.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest border border-dashed border-white/10 rounded-2xl bg-black/20">
                  {selectedDay ? "No events for this date." : "No events found"}
                </div>
              ) : (
                filteredEvents?.map((event: any) => {
                  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.General;
                  const TypeIcon = config.icon;
                  return (
                    <div key={event.id} className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all group flex items-start gap-3">
                      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${config.bg} ${config.color} ${config.border}`}>
                        <TypeIcon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-white text-xs truncate">{event.title}</h5>
                        <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase mt-0.5">
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {event.assignee && (
                          <p className="text-[8px] font-mono text-purple-400 mt-0.5">→ {event.assignee.name}</p>
                        )}
                      </div>
                      <span className={`text-[7px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLORS[event.status] || ''}`}>
                        {event.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
