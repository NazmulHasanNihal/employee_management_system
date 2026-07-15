"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Clock, Target, Calendar, CheckCircle2, Check,
  UserPlus, X, Shield, AlertTriangle, Layers, Filter, Eye,
  ArrowRight, ChevronDown, ChevronRight, Plus, MoreHorizontal,
  ListTodo, KanbanSquare, BarChart3, Zap, ArrowUpRight, Trash2
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

type ViewTab = 'chain' | 'tasks' | 'performance';
type TaskStatus = 'ToDo' | 'InProgress' | 'Done' | 'Blocked';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  ToDo: { label: 'To Do', color: 'text-[var(--text-muted)]', bg: 'bg-white/5', border: 'border-white/10' },
  InProgress: { label: 'In Progress', color: 'text-[var(--ledger-blue)]', bg: 'bg-[var(--ledger-blue)]/10', border: 'border-[var(--ledger-blue)]/30' },
  Done: { label: 'Done', color: 'text-[var(--verify-green)]', bg: 'bg-[var(--verify-green)]/10', border: 'border-[var(--verify-green)]/30' },
  Blocked: { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  High: { color: 'text-red-400', bg: 'bg-red-500/20' },
  Medium: { color: 'text-[var(--signal-amber)]', bg: 'bg-[var(--signal-amber)]/20' },
  Low: { color: 'text-[var(--ledger-blue)]', bg: 'bg-[var(--ledger-blue)]/20' },
};

export default function TeamDashboardPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager' || user?.role === 'Super Admin';
  const isManager = user?.role === 'Manager' || isAdmin;

  const [activeTab, setActiveTab] = useState<ViewTab>('chain');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Data fetching
  const { data: chainData, isLoading: chainLoading } = trpc.team.getChainOfCommand.useQuery();
  const { data: teamTasks, isLoading: tasksLoading } = trpc.team.getTeamTasks.useQuery();
  const { data: teamPerformance, isLoading: perfLoading } = trpc.team.getTeamPerformance.useQuery();
  const { data: myTeam } = trpc.team.getMyTeam.useQuery();

  const createTaskMutation = trpc.team.createTask.useMutation({
    onSuccess: () => {
      setShowCreateTask(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('Medium');
      setTaskAssigneeId('');
      setTaskDueDate('');
      // Refresh would happen via invalidation in a real trpc setup
      window.location.reload();
    }
  });

  const updateTaskStatusMutation = trpc.team.updateTaskStatus.useMutation({
    onSuccess: () => window.location.reload()
  });

  const deleteTaskMutation = trpc.team.deleteTask.useMutation({
    onSuccess: () => window.location.reload()
  });

  const handleCreateTask = () => {
    if (!taskTitle || !taskAssigneeId) return;
    createTaskMutation.mutate({
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      assigneeId: taskAssigneeId,
      dueDate: taskDueDate || null,
    });
  };

  const handleUpdateTaskStatus = (taskId: string, status: string) => {
    updateTaskStatusMutation.mutate({ id: taskId, status });
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Delete this task?')) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  const chain = chainData || { chain: [], directReports: [], peers: [], secondLevelReports: [] };
  const tasks = (teamTasks || []) as any[];
  const performance = (teamPerformance || []) as any[];
  const allTeamMembers = myTeam?.directReports || [];

  // Separate tasks by status for Kanban
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, any[]> = { ToDo: [], InProgress: [], Done: [], Blocked: [] };
    const currentTasks = (teamTasks || []) as any[];
    currentTasks.forEach(t => {
      if (grouped[t.status as TaskStatus]) {
        grouped[t.status as TaskStatus].push(t);
      }
    });
    return grouped;
  }, [teamTasks]);

  if (!user) {
    return <div className="text-center p-8 text-white font-mono animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <Users className="text-[var(--ledger-blue)]" size={36} />
            My Team
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Chain of command, tasks, and team performance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 w-max">
        {[
          { id: 'chain' as ViewTab, label: 'Chain of Command', icon: Layers },
          { id: 'tasks' as ViewTab, label: 'Task Board', icon: KanbanSquare },
          { id: 'performance' as ViewTab, label: 'Performance', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--ledger-blue)] text-black font-bold shadow-[0_0_15px_rgba(0,195,255,0.2)]'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ────────── CHAIN OF COMMAND ────────── */}
      {activeTab === 'chain' && (
        <div className="space-y-6">
          {chainLoading ? (
            <div className="text-center p-8 text-white font-mono animate-pulse uppercase tracking-widest">Loading hierarchy...</div>
          ) : (
            <>
              {/* Upward Chain */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Shield size={16} className="text-[var(--signal-amber)]" /> Reporting Chain
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {chain.chain.map((person: any, i: number) => (
                    <React.Fragment key={person.id}>
                      <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        person.id === user?.id
                          ? 'bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]/30 shadow-[0_0_15px_rgba(0,195,255,0.1)]'
                          : 'bg-black/30 border-white/5 hover:border-white/20'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm border ${
                          person.id === user?.id
                            ? 'bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/30'
                            : 'bg-white/5 text-white border-white/10'
                        }`}>
                          {person.avatarUrl ? (
                            <img src={person.avatarUrl} alt={person.name} className="w-full h-full rounded-full object-cover" />
                          ) : person.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{person.name}</p>
                          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{person.designation}</p>
                          <p className="text-[8px] font-mono text-[var(--ledger-blue)] uppercase">{person.department}</p>
                        </div>
                        {person.id === user?.id && (
                          <span className="text-[8px] font-mono bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>
                        )}
                      </div>
                      {i < chain.chain.length - 1 && (
                        <ArrowRight size={16} className="text-[var(--text-muted)] shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Direct Reports */}
              {chain.directReports.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Users size={16} className="text-[var(--verify-green)]" /> Direct Reports ({chain.directReports.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chain.directReports.map((report: any) => (
                      <div key={report.id} className="flex items-center gap-3 p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-[var(--verify-green)]/20 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-[var(--verify-green)]/10 flex items-center justify-center text-[var(--verify-green)] font-bold font-mono border border-[var(--verify-green)]/20">
                          {report.avatarUrl ? (
                            <img src={report.avatarUrl} alt={report.name} className="w-full h-full rounded-full object-cover" />
                          ) : report.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{report.name}</p>
                          <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{report.designation}</p>
                          <p className="text-[8px] font-mono text-[var(--ledger-blue)] uppercase">{report.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peers */}
              {chain.peers && chain.peers.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap size={16} className="text-purple-400" /> Team Peers ({chain.peers.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {chain.peers.map((peer: any) => (
                      <div key={peer.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold font-mono text-xs border border-purple-500/20">
                          {peer.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{peer.name}</p>
                          <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase">{peer.designation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Second Level Reports */}
              {chain.secondLevelReports && chain.secondLevelReports.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" /> Extended Team
                  </h3>
                  <div className="space-y-4">
                    {chain.secondLevelReports.map((group: any, i: number) => (
                      <div key={i}>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">
                          Reports to {group.managerName}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {group.reports.map((r: any) => (
                            <div key={r.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5 text-xs">
                              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-muted)] font-mono text-[10px]">
                                {r.name.charAt(0)}
                              </div>
                              <span className="text-white truncate">{r.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ────────── TASK BOARD ────────── */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Create Task Button */}
          {isManager && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateTask(!showCreateTask)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ledger-blue)] text-black font-bold font-mono text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all"
              >
                {showCreateTask ? <X size={16} /> : <Plus size={16} />}
                {showCreateTask ? 'Cancel' : 'Assign Task'}
              </button>
            </div>
          )}

          {/* Create Task Form */}
          {showCreateTask && (
            <div className="bg-white/5 border border-[var(--ledger-blue)]/30 rounded-3xl p-6 shadow-xl animate-in slide-in-from-top-4">
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus size={16} className="text-[var(--ledger-blue)]" /> Assign New Task
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Task Title</label>
                  <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none" placeholder="Task title..." />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Assign To</label>
                  <select value={taskAssigneeId} onChange={e => setTaskAssigneeId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none appearance-none">
                    <option value="">Select team member...</option>
                    {allTeamMembers.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name} — {m.designation}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Priority</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button key={p} onClick={() => setTaskPriority(p)} className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${taskPriority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current` : 'bg-black/30 text-[var(--text-muted)] border-white/5'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Due Date</label>
                  <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Description</label>
                <textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none resize-none h-20" placeholder="Task details..." />
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={handleCreateTask} disabled={!taskTitle || !taskAssigneeId} className="px-6 py-2.5 bg-[var(--verify-green)] text-black font-bold font-mono text-xs uppercase tracking-widest rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                  <Check size={16} /> Assign Task
                </button>
              </div>
            </div>
          )}

          {/* Kanban Board */}
          {tasksLoading ? (
            <div className="text-center p-8 text-white font-mono animate-pulse uppercase tracking-widest">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
              <ListTodo size={32} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
              <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No tasks yet</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2">Assign tasks to your team members to track progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['ToDo', 'InProgress', 'Done', 'Blocked'] as TaskStatus[]).map(status => (
                <div key={status} className={`rounded-2xl border p-4 min-h-[300px] ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-mono text-xs font-bold uppercase tracking-widest ${STATUS_CONFIG[status].color}`}>
                      {STATUS_CONFIG[status].label}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] bg-black/30 px-2 py-0.5 rounded-full">
                      {tasksByStatus[status].length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasksByStatus[status].map((task: any) => (
                      <div key={task.id} className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-white/20 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold text-white flex-1">{task.title}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isManager && (
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-[10px] text-[var(--text-muted)] mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-mono text-white">
                              {task.assignee?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">{task.assignee?.name}</span>
                          </div>
                          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[task.priority]?.bg || ''} ${PRIORITY_CONFIG[task.priority]?.color || ''}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.dueDate && (
                          <p className="text-[8px] font-mono text-[var(--text-muted)] mt-2 flex items-center gap-1">
                            <Calendar size={10} /> Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        {/* Status Change Buttons */}
                        <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                          {status !== 'Done' && (
                            <button onClick={() => handleUpdateTaskStatus(task.id, 'Done')} className="text-[8px] font-mono text-[var(--verify-green)] hover:bg-[var(--verify-green)]/10 px-2 py-1 rounded transition-colors uppercase">✓ Done</button>
                          )}
                          {status !== 'InProgress' && status !== 'Done' && (
                            <button onClick={() => handleUpdateTaskStatus(task.id, 'InProgress')} className="text-[8px] font-mono text-[var(--ledger-blue)] hover:bg-[var(--ledger-blue)]/10 px-2 py-1 rounded transition-colors uppercase">▶ Start</button>
                          )}
                          {status !== 'Blocked' && status !== 'Done' && (
                            <button onClick={() => handleUpdateTaskStatus(task.id, 'Blocked')} className="text-[8px] font-mono text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors uppercase">⊘ Block</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────── PERFORMANCE ────────── */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {perfLoading ? (
            <div className="text-center p-8 text-white font-mono animate-pulse uppercase tracking-widest">Loading performance data...</div>
          ) : performance.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
              <BarChart3 size={32} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
              <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No performance data</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performance.map((member: any) => {
                const statusColor = member.completionRate >= 80 ? 'text-[var(--verify-green)]' : member.completionRate >= 50 ? 'text-[var(--signal-amber)]' : 'text-red-400';
                const statusLabel = member.completionRate >= 80 ? 'On Track' : member.completionRate >= 50 ? 'Needs Attention' : 'Behind';
                
                return (
                  <div key={member.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--ledger-blue)]/10 flex items-center justify-center text-[var(--ledger-blue)] font-bold font-mono border border-[var(--ledger-blue)]/20">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : member.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{member.name}</p>
                        <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase">{member.designation}</p>
                      </div>
                      <span className={`text-[8px] font-mono uppercase px-2 py-1 rounded-full border ${statusColor} bg-current/10`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)] mb-1">
                          <span>Task Completion</span>
                          <span className={statusColor}>{member.completionRate}%</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--ledger-blue)] rounded-full transition-all duration-700" style={{ width: `${member.completionRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)] mb-1">
                          <span>Attendance</span>
                          <span>{member.attendanceRate}%</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--verify-green)] rounded-full transition-all duration-700" style={{ width: `${member.attendanceRate}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
                      <div className="text-center">
                        <p className="text-lg font-mono font-black text-white">{member.totalTasks}</p>
                        <p className="text-[7px] font-mono text-[var(--text-muted)] uppercase">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-mono font-black text-[var(--verify-green)]">{member.doneTasks}</p>
                        <p className="text-[7px] font-mono text-[var(--text-muted)] uppercase">Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-mono font-black text-[var(--ledger-blue)]">{member.inProgressTasks}</p>
                        <p className="text-[7px] font-mono text-[var(--text-muted)] uppercase">Active</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
