'use client';

import React, { useState, useMemo } from 'react';
import { Plus, X, Check, Trash2, ListTodo } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';

type TaskStatus = 'ToDo' | 'InProgress' | 'Done' | 'Blocked';

const STATUS_CONFIG: Record<TaskStatus, { label: string; tone: string; bar: string }> = {
  ToDo: { label: 'To Do', tone: 'text-[var(--text-muted)] border-[var(--border-hairline)]', bar: 'bg-[var(--bg-hover)]' },
  InProgress: { label: 'In Progress', tone: 'text-[var(--brand)] border-[var(--brand)]/30', bar: 'bg-[var(--brand)]' },
  Done: { label: 'Done', tone: 'text-[var(--emerald)] border-[var(--emerald)]/30', bar: 'bg-[var(--emerald)]' },
  Blocked: { label: 'Blocked', tone: 'text-[var(--rose)] border-[var(--rose)]/30', bar: 'bg-[var(--rose)]' },
};

const PRIORITY_TONE: Record<string, string> = {
  High: 'text-[var(--rose)] bg-[var(--rose-soft)]',
  Medium: 'text-[var(--amber)] bg-[var(--amber-soft)]',
  Low: 'text-[var(--brand)] bg-[var(--brand-soft)]',
};

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority?: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: { id: string; name: string; avatarUrl?: string | null; designation?: string | null } | null;
  assigner?: { id: string; name: string } | null;
}

interface Member {
  id: string;
  name: string;
  designation?: string | null;
  avatarUrl?: string | null;
}

export default function TeamTasksBoard({
  tasks,
  members,
  isManager,
}: {
  tasks: Task[];
  members: Member[];
  isManager: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TaskStatus>('ToDo');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Mount the task list as a live query (seeded with the server prop) so
  // mutations can refresh it in place via utils.invalidate — no full reload.
  const utils = trpc.useUtils();
  const { data: taskData } = trpc.team.getTeamTasks.useQuery(undefined, { initialData: tasks as any });
  const liveTasks = (taskData as Task[] | undefined) ?? tasks;

  const createMutation = trpc.team.createTask.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      setTitle(''); setDescription(''); setPriority('Medium'); setAssigneeId(''); setDueDate('');
      utils.team.getTeamTasks.invalidate();
    },
  });
  const updateStatusMutation = trpc.team.updateTaskStatus.useMutation({
    onSuccess: () => utils.team.getTeamTasks.invalidate(),
  });
  const deleteMutation = trpc.team.deleteTask.useMutation({
    onSuccess: () => utils.team.getTeamTasks.invalidate(),
  });

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { ToDo: [], InProgress: [], Done: [], Blocked: [] };
    liveTasks.forEach((t) => {
      if (grouped[t.status as TaskStatus]) grouped[t.status as TaskStatus].push(t);
    });
    return grouped;
  }, [liveTasks]);

  const handleCreate = () => {
    if (!title || !assigneeId) return;
    createMutation.mutate({
      title,
      description,
      priority,
      assigneeId,
      dueDate: dueDate || null,
    });
  };

  if (liveTasks.length === 0 && !isManager) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Assign tasks to your team members to track progress."
        icon={<ListTodo className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-5">
      {isManager && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? 'Cancel' : 'Assign Task'}
          </button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-5 animate-scale-in">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="ledger-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="Task title..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Assign To</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="ledger-input w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Select team member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.designation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Priority</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                      priority === p ? `${PRIORITY_TONE[p]}` : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="ledger-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="ledger-input w-full rounded-xl px-3 py-2 text-sm"
              rows={2}
              placeholder="Task details..."
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={!title || !assigneeId}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Assign Task
            </button>
          </div>
        </div>
      )}

      {/* Status filter tabs (mobile only) */}
      <div className="flex flex-wrap gap-2 lg:hidden">
        {(['ToDo', 'InProgress', 'Done', 'Blocked'] as TaskStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              activeTab === s ? STATUS_CONFIG[s].tone : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
            }`}
          >
            {STATUS_CONFIG[s].label} ({tasksByStatus[s].length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(['ToDo', 'InProgress', 'Done', 'Blocked'] as TaskStatus[]).map((status) => (
          <div
            key={status}
            className={`rounded-2xl border p-3 flex-col ${STATUS_CONFIG[status].tone} ${activeTab === status ? 'flex' : 'hidden lg:flex'}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wide">{STATUS_CONFIG[status].label}</h4>
              <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {tasksByStatus[status].length}
              </span>
            </div>
            <div className="space-y-3">
              {tasksByStatus[status].map((task) => (
                <div key={task.id} className="group rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-3 transition-colors hover:border-[var(--brand)]/30">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-sm font-semibold text-[var(--text-main)]">{task.title}</p>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {isManager && (
                        <button onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate({ id: task.id }); }} className="p-1 text-[var(--rose)] hover:bg-[var(--rose-soft)] rounded">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {task.description && (
                    <p className="mb-2 line-clamp-2 text-[11px] text-[var(--text-muted)]">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar src={task.assignee?.avatarUrl} name={task.assignee?.name} size="xs" />
                      <span className="text-[11px] text-[var(--text-muted)]">{task.assignee?.name}</span>
                    </div>
                    {task.priority && (
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${PRIORITY_TONE[task.priority] || ''}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                  {task.dueDate && (
                    <p className="mt-2 text-[9px] text-[var(--text-muted)]">
                      Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1 border-t border-[var(--border-hairline)] pt-2">
                    {status !== 'Done' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'Done' })} className="text-[9px] font-semibold text-[var(--emerald)] hover:bg-[var(--emerald-soft)] rounded px-2 py-1">✓ Done</button>
                    )}
                    {status !== 'InProgress' && status !== 'Done' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'InProgress' })} className="text-[9px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] rounded px-2 py-1">▶ Start</button>
                    )}
                    {status !== 'Blocked' && status !== 'Done' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'Blocked' })} className="text-[9px] font-semibold text-[var(--rose)] hover:bg-[var(--rose-soft)] rounded px-2 py-1">⊘ Block</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
