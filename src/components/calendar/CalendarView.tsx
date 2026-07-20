'use client';

import React, { useState, useMemo } from 'react';
import { CalendarDays, Plus, Wallet, Filter, X, Check, ChevronLeft, ChevronRight, Target, Bell, Trash2, Edit3, ListTodo, LayoutGrid, List, CalendarCheck2, Users, PartyPopper, Baby } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';

type ViewMode = 'month' | 'week' | 'agenda';
type EventType = 'Holiday' | 'Meeting' | 'Payroll' | 'Task' | 'Reminder' | 'Social' | 'General';
type Derived = 'event' | 'holiday' | 'shift' | 'birthday';

const EVENT_TYPE: Record<string, { tone: string; bg: string; icon: any }> = {
  Holiday: { tone: 'text-[var(--amber)] bg-[var(--amber-soft)]', bg: 'bg-[var(--amber-soft)]', icon: CalendarDays },
  Meeting: { tone: 'text-[var(--brand)] bg-[var(--brand-soft)]', bg: 'bg-[var(--brand-soft)]', icon: ListTodo },
  Payroll: { tone: 'text-[var(--emerald)] bg-[var(--emerald-soft)]', bg: 'bg-[var(--emerald-soft)]', icon: Wallet },
  Task: { tone: 'text-[var(--sky)] bg-[var(--sky-soft)]', bg: 'bg-[var(--sky-soft)]', icon: Target },
  Reminder: { tone: 'text-[var(--brand)] bg-[var(--brand-soft)]', bg: 'bg-[var(--brand-soft)]', icon: Bell },
  Social: { tone: 'text-[var(--rose)] bg-[var(--rose-soft)]', bg: 'bg-[var(--rose-soft)]', icon: Users },
  General: { tone: 'text-[var(--text-muted)] bg-[var(--bg-hover)]', bg: 'bg-[var(--bg-hover)]', icon: CalendarCheck2 },
};

const DERIVED_ICON: Record<Derived, any> = {
  event: CalendarCheck2,
  holiday: CalendarDays,
  shift: ListTodo,
  birthday: Baby,
};

const STATUS_TONE: Record<string, string> = {
  Pending: 'text-[var(--amber)] bg-[var(--amber-soft)]',
  InProgress: 'text-[var(--brand)] bg-[var(--brand-soft)]',
  Done: 'text-[var(--emerald)] bg-[var(--emerald-soft)]',
  Cancelled: 'text-[var(--rose)] bg-[var(--rose-soft)]',
};

interface CalEvent {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  type: EventType;
  status: string;
  assigneeId?: string | null;
  creatorId?: string | null;
  targetTeam?: string | null;
  assignee?: { name: string } | null;
  derived?: Derived;
  isTentative?: boolean;
}

interface Member { id: string; name: string; }
interface Department { id: string; name: string; }

/**
 * Parse an event date, returning `null` for missing/invalid values instead of
 * falling back to the Unix epoch (which would silently misplace events in 1970
 * and break month/week/day filtering). Derived events (holidays, birthdays,
 * shifts) may legitimately lack a `date`.
 */
function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function CalendarView({ events, teamMembers, departments }: { events: CalEvent[]; teamMembers: Member[]; departments: Department[] }) {
  const { user, isAdmin } = useUser();
  const isManager = isAdmin || user.role === 'Manager';

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDerived, setFilterDerived] = useState<Derived | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<EventType>('General');
  const [status, setStatus] = useState('Pending');
  const [assigneeId, setAssigneeId] = useState('');
  const [targetTeam, setTargetTeam] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);

  const utils = trpc.useUtils();
  const createEvent = trpc.calendar.createEvent.useMutation({ onSuccess: () => { setShowAdd(false); setTitle(''); setDescription(''); setDate(''); setEndDate(''); setAssigneeId(''); setTargetTeam(''); utils.invalidate('calendar'); } });
  const updateEventMutation = trpc.calendar.updateEvent.useMutation({ onSuccess: () => utils.invalidate('calendar') });
  const deleteEventMutation = trpc.calendar.deleteEvent.useMutation({ onSuccess: () => utils.invalidate('calendar') });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    createEvent.mutate({ title, description, date: new Date(date).toISOString(), endDate: endDate ? new Date(endDate).toISOString() : null, type, status, assigneeId: assigneeId || null, targetTeam: targetTeam || null, reminderMinutes });
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const todayDate = new Date().getDate();
  const todayMonth = new Date().getMonth();
  const todayYear = new Date().getFullYear();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: 42 }, (_, i) => { const d = i - firstDay + 1; return d > 0 && d <= daysInMonth ? d : null; });
  const navigateMonth = (dir: number) => { const nd = new Date(currentDate); nd.setMonth(nd.getMonth() + dir); setCurrentDate(nd); setSelectedDay(null); };

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (filterType) result = result.filter((e) => e.type === filterType);
    if (filterStatus) result = result.filter((e) => e.status === filterStatus);
    if (filterDerived) result = result.filter((e) => (e.derived || 'event') === filterDerived);
    if (selectedDay) result = result.filter((e) => { const d = safeDate(e.date); return !!d && d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    return result.sort((a, b) => {
      const da = safeDate(a.date)?.getTime() ?? 0;
      const db = safeDate(b.date)?.getTime() ?? 0;
      return da - db;
    });
  }, [events, filterType, filterStatus, filterDerived, selectedDay, currentMonth, currentYear]);

  const weekDays = useMemo(() => {
    const sow = new Date(currentDate);
    sow.setDate(sow.getDate() - sow.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(sow); d.setDate(d.getDate() + i); return d; });
  }, [currentDate]);

  const nextPayday = useMemo(() => {
    const future = events.filter((e) => e.type === 'Payroll' && new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (future.length === 0) return null;
    return Math.ceil((new Date(future[0].date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }, [events]);

  const myUpcomingTasks = useMemo(() => events.filter((e) => (e.assigneeId === user.id || e.creatorId === user.id) && e.type === 'Task' && e.status !== 'Done' && e.status !== 'Cancelled').slice(0, 5), [events, user.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <p className="text-sm text-[var(--text-muted)]">Events, tasks, reminders, and team schedules.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-1">
            {([{ id: 'month' as ViewMode, icon: LayoutGrid, label: 'Month' }, { id: 'week' as ViewMode, icon: List, label: 'Week' }, { id: 'agenda' as ViewMode, icon: ListTodo, label: 'Agenda' }]).map((v) => (
              <button key={v.id} onClick={() => setViewMode(v.id)} className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase ${viewMode === v.id ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)]'}`}>
                <v.icon size={12} /> {v.label}
              </button>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showAdd ? 'Close' : 'Add Event'}
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="animate-scale-in rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]"><Plus className="h-4 w-4 text-[var(--brand)]" /> Create Event</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Event Title</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="E.g. Q3 Planning" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Start Date</label>
                <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">End Date (Optional)</label>
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Type</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Task', 'Meeting', 'Reminder', 'Holiday', 'Payroll', 'Social', 'General'] as EventType[]).map((t) => (
                    <button key={t} type="button" onClick={() => setType(t)} className={`rounded-lg py-1.5 text-[8px] font-semibold uppercase ${type === t ? `${EVENT_TYPE[t].tone} border border-current` : 'border border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Assign To (Optional)</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                  <option value="">No assignment</option>
                  {teamMembers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Reminder</label>
                <select value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                  <option value={0}>No reminder</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="ledger-input h-20 w-full resize-none rounded-xl px-3 py-2.5 text-sm" placeholder="Additional details..." />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="md" type="submit"><Check className="h-4 w-4" /> Schedule</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {viewMode === 'month' && (
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-[var(--text-main)]">{monthName} {currentYear}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}><ChevronLeft className="h-3.5 w-3.5" /> Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(null); }}>Today</Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>Next <ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (<div key={d} className="text-center text-[10px] uppercase tracking-wide text-[var(--text-muted)] py-2">{d}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysArray.map((day, i) => {
                  if (!day) return <div key={i} className="pointer-events-none opacity-0" />;
                  const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                  const isSelected = day === selectedDay;
                  const dayEvents = events.filter((e) => { const d = safeDate(e.date); return !!d && d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
                  return (
                    <button key={i} onClick={() => setSelectedDay(isSelected ? null : day)} className={`flex aspect-square flex-col items-center justify-center rounded-2xl transition-colors ${isSelected ? 'border-2 border-[var(--brand)] bg-[var(--brand-soft)]' : isToday ? 'border-2 border-[var(--text-main)] text-[var(--text-main)]' : 'border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 text-[var(--text-muted)] hover:border-[var(--brand)]/50'}`}>
                      <span className="text-lg">{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                          {dayEvents.slice(0, 4).map((evt) => {
                            const dotColor = evt.derived === 'holiday' ? 'bg-[var(--amber)]' : evt.derived === 'birthday' ? 'bg-[var(--rose)]' : evt.derived === 'shift' ? 'bg-[var(--brand)]' : (EVENT_TYPE[evt.type]?.bg || 'bg-[var(--bg-hover)]');
                            return <div key={evt.id} title={evt.title} className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />;
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[var(--text-main)]">Week of {weekDays[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                  <Button variant="ghost" size="sm" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((day, i) => {
                  const isToday = day.getDate() === todayDate && day.getMonth() === todayMonth && day.getFullYear() === todayYear;
                  const dayEvents = events.filter((e) => { const d = safeDate(e.date); return !!d && d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear(); });
                  return (
                    <div key={i} className={`min-h-[200px] rounded-2xl border p-3 ${isToday ? 'border-[var(--brand)]/50 bg-[var(--brand-soft)]' : 'border-[var(--border-hairline)] bg-[var(--bg-hover)]/40'}`}>
                      <div className="mb-3 text-center">
                        <p className="text-[9px] uppercase text-[var(--text-muted)]">{day.toLocaleDateString('en', { weekday: 'short' })}</p>
                        <p className={`text-lg font-bold ${isToday ? 'text-[var(--brand-strong)]' : 'text-[var(--text-main)]'}`}>{day.getDate()}</p>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((evt) => (
                          <div key={evt.id} title={evt.title} className={`truncate rounded-lg p-1.5 text-[8px] font-semibold uppercase ${EVENT_TYPE[evt.type]?.tone || EVENT_TYPE.General.tone}`}>{evt.title}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-[var(--text-main)]">Agenda</h3>
              {filteredEvents.length === 0 ? (
                <p className="p-8 text-center text-xs uppercase text-[var(--text-muted)]">No events</p>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const config = EVENT_TYPE[event.type] || EVENT_TYPE.General;
                    const TypeIcon = config.icon;
                    return (
                      <div key={event.id} className={`group flex items-start gap-4 rounded-2xl border p-4 ${config.bg} border-[var(--border-hairline)]`}>
                        <div className={`rounded-xl p-2.5 ${config.tone}`}><TypeIcon size={18} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-[var(--text-main)]">{event.title}</h4>
                              <p className="mt-1 text-[10px] uppercase text-[var(--text-muted)]">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-1 text-[8px] font-semibold uppercase ${STATUS_TONE[event.status] || ''}`}>{event.status}</span>
                              {event.assignee && <span className="rounded-full bg-[var(--bg-hover)] px-2 py-1 text-[8px] font-semibold uppercase text-[var(--text-muted)]">→ {event.assignee.name}</span>}
                            </div>
                          </div>
                          {event.description && <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{event.description}</p>}
                          {event.derived === 'event' && (
                            <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              {event.status !== 'Done' && <button onClick={() => updateEventMutation.mutate({ id: event.id, status: 'Done' })} className="text-[8px] font-semibold uppercase text-[var(--emerald)] hover:bg-[var(--emerald-soft)] rounded px-2 py-1">✓ Done</button>}
                              {event.status === 'Pending' && <button onClick={() => updateEventMutation.mutate({ id: event.id, status: 'InProgress' })} className="text-[8px] font-semibold uppercase text-[var(--brand)] hover:bg-[var(--brand-soft)] rounded px-2 py-1">▶ Start</button>}
                              <button onClick={() => { if (confirm('Delete this event?')) deleteEventMutation.mutate({ id: event.id }); }} className="text-[8px] font-semibold uppercase text-[var(--rose)] hover:bg-[var(--rose-soft)] rounded px-2 py-1">✕ Delete</button>
                            </div>
                          )}
                          {event.derived !== 'event' && (
                            <span className="mt-2 inline-flex items-center gap-1.5">
                              <span className="inline-block rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[7px] font-semibold uppercase text-[var(--text-muted)]">{event.derived} · read-only</span>
                              {event.isTentative && (
                                <span className="inline-block rounded-full bg-[var(--amber-soft)] px-2 py-0.5 text-[7px] font-semibold uppercase text-[var(--amber)]">Tentative</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-main)]"><Wallet className="h-3.5 w-3.5 text-[var(--emerald)]" /> Next Payroll</h4>
            <div className="flex items-end gap-3">
              {nextPayday !== null ? (<><span className="text-4xl font-bold text-[var(--text-main)]">{nextPayday}</span><span className="mb-1 text-sm uppercase text-[var(--text-muted)]">Days</span></>) : (<span className="text-sm uppercase text-[var(--text-muted)]">No upcoming payroll</span>)}
            </div>
          </div>

          {myUpcomingTasks.length > 0 && (
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-main)]"><Target className="h-3.5 w-3.5 text-[var(--brand)]" /> My Tasks</h4>
              <div className="space-y-2">
                {myUpcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-2.5">
                    <div className={`h-2 w-2 rounded-full ${task.status === 'InProgress' ? 'animate-pulse bg-[var(--brand)]' : 'bg-[var(--amber)]'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[var(--text-main)]">{task.title}</p>
                      <p className="text-[8px] uppercase text-[var(--text-muted)]">{new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase ${STATUS_TONE[task.status] || ''}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-main)]"><Filter className="h-3.5 w-3.5 text-[var(--brand)]" /> Quick Filters</h4>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-[9px] uppercase text-[var(--text-muted)]">By Type</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterType(null)} className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase ${!filterType ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>All</button>
                  {Object.keys(EVENT_TYPE).map((t) => (<button key={t} onClick={() => setFilterType(filterType === t ? null : t)} className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase ${filterType === t ? `${EVENT_TYPE[t].tone} border-current` : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{t}</button>))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[9px] uppercase text-[var(--text-muted)]">By Status</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterStatus(null)} className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase ${!filterStatus ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>All</button>
                  {['Pending', 'InProgress', 'Done'].map((s) => (<button key={s} onClick={() => setFilterStatus(filterStatus === s ? null : s)} className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase ${filterStatus === s ? `${STATUS_TONE[s]} border-current` : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{s}</button>))}
                </div>
              </div>
                <div>
                <p className="mb-2 text-[9px] uppercase text-[var(--text-muted)]">Source</p>
                <div className="flex flex-wrap gap-2">
                  {([{ id: null as Derived | null, label: 'All' }, { id: 'holiday' as Derived, label: 'Holidays' }, { id: 'birthday' as Derived, label: 'Birthdays' }, { id: 'shift' as Derived, label: 'Shifts' }]).map((src) => (
                    <button key={src.label} onClick={() => setFilterDerived(src.id)} className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase ${filterDerived === src.id ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{src.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-main)]"><PartyPopper className="h-3.5 w-3.5 text-[var(--amber)]" /> Legend</h4>
            <div className="space-y-2 text-[10px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--amber)]" /> Bangladesh Holidays</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--rose)]" /> Birthdays</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" /> Shift Rosters</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--sky)]" /> Tasks &amp; Meetings</div>
            </div>
          </div>

          <div className="flex min-h-[300px] flex-1 flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-main)]"><CalendarCheck2 className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {selectedDay ? `${monthName} ${selectedDay}` : 'Upcoming'}</h4>
              {selectedDay && <button onClick={() => setSelectedDay(null)} className="text-[10px] uppercase text-[var(--brand)] hover:underline">Clear</button>}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-8 text-center text-[10px] uppercase text-[var(--text-muted)]">{selectedDay ? 'No events for this date.' : 'No events found'}</div>
              ) : (
                filteredEvents.map((event) => {
                  const config = EVENT_TYPE[event.type] || EVENT_TYPE.General;
                  const TypeIcon = config.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3 group">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.tone}`}><TypeIcon size={14} /></div>
                      <div className="min-w-0 flex-1">
                        <h5 className="truncate text-xs font-semibold text-[var(--text-main)]">{event.title}</h5>
                        <p className="mt-0.5 text-[9px] uppercase text-[var(--text-muted)]">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        {event.assignee && <p className="mt-0.5 text-[8px] uppercase text-[var(--brand)]">→ {event.assignee.name}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase ${STATUS_TONE[event.status] || ''}`}>{event.status}</span>
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
