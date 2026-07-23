"use client";

import React, { useEffect, useState } from 'react';
import { Rocket, CheckSquare, ShieldOff, AlertTriangle, AlertCircle, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/lib/toast';
import { useUser } from '@/components/UserProvider';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';

interface OnboardingTask {
  id: string;
  title: string;
  isCompleted: boolean;
  category: string;
  userId: string;
}

interface UserOption {
  id: string;
  name: string;
}

export default function OnboardingClientPage() {
  const { user } = useUser();
  const isAdmin = user.role === 'Admin' || user.role === 'HR Manager';

  const [targetUserId, setTargetUserId] = useState(user.id || '');
  const [newTask, setNewTask] = useState('');
  const [offboardUserId, setOffboardUserId] = useState('');

  const { data: users } = trpc.registry.searchEmployees.useQuery(
    { query: '' },
    { enabled: isAdmin }
  );
  const { data: serverTasks, isLoading } = trpc.workflows.getOnboardingTasks.useQuery(
    { userId: targetUserId },
    { enabled: !!targetUserId }
  );

  const [localTasks, setLocalTasks] = useState<OnboardingTask[]>([]);

  useEffect(() => {
    if (serverTasks) setLocalTasks(serverTasks);
  }, [serverTasks]);

  const utils = trpc.useUtils();
  const createTask = trpc.workflows.createTask.useMutation({
    onSuccess: () => {
      utils.workflows.getOnboardingTasks.invalidate();
      setNewTask('');
    },
  });

  const toggleTask = trpc.workflows.toggleTask.useMutation({
    onSuccess: () => utils.workflows.getOnboardingTasks.invalidate(),
    onError: () => {
      if (serverTasks) setLocalTasks(serverTasks);
    },
  });

  const handleToggleTask = (id: string, isCompleted: boolean) => {
    setLocalTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted } : t)));
    toggleTask.mutate({ id, isCompleted });
  };

  const triggerOffboarding = trpc.workflows.triggerOffboarding.useMutation({
    onSuccess: () => {
      toast.success('Offboarding triggered', 'Employee terminated and IT ticket created.');
      setOffboardUserId('');
    },
    onError: (err: { message: string }) => toast.error('Offboarding failed', err.message),
  });

  const triggerProbation = trpc.workflows.triggerProbationPlan.useMutation({
    onSuccess: () => {
      utils.workflows.getOnboardingTasks.invalidate();
      toast.success('Probation plan initialized', '30 / 60 / 90 day check-ins created.');
    },
    onError: (err: { message: string }) => toast.error('Failed', err.message),
  });

  const finalizeSeverance = trpc.workflows.finalizeSeverance.useMutation({
    onSuccess: (data: { message?: string }) => toast.success('Severance released', data?.message),
    onError: (err: { message: string }) => toast.error('Severance failed', err.message),
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !targetUserId) return;
    createTask.mutate({ userId: targetUserId, task: newTask });
  };

  const handleOffboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offboardUserId) return;
    if (confirm('Are you sure? This will terminate the employee and revoke access immediately.')) {
      triggerOffboarding.mutate({ userId: offboardUserId });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 animate-fade-up">
      <PageHeader
        title="HR Workflows"
        subtitle="Automated onboarding checklists and offboarding protocols."
        icon={<Rocket size={20} />}
        actions={isAdmin ? <Badge variant="brand">Admin</Badge> : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Onboarding Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare size={16} className="text-[var(--brand-strong)]" /> Onboarding Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">View Checklist For</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="ledger-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value={user.id}>Myself</option>
                    {users?.map((u: UserOption) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => targetUserId && triggerProbation.mutate({ userId: targetUserId })}
                  disabled={!targetUserId || triggerProbation.isPending}
                >
                  <UserPlus size={14} /> Init Probation
                </Button>
              </div>
            )}

            {isLoading ? (
              <p className="py-4 text-center text-sm text-[var(--text-muted)]">Loading tasks…</p>
            ) : (
              <>
                <div className="space-y-2">
                  {localTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                        task.isCompleted
                          ? 'border-[var(--emerald)]/30 bg-[var(--emerald-soft)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-hover)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--border-hairline)] text-[var(--brand)] focus:ring-[var(--brand)]"
                      />
                      <span className={`text-sm font-medium ${task.isCompleted ? 'text-[var(--emerald)] line-through' : 'text-[var(--text-main)]'}`}>
                         {task.title}
                      </span>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <form onSubmit={handleAddTask} className="flex gap-2">
                    <Input
                      required
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="New task…"
                    />
                    <Button type="submit" disabled={createTask.isPending}>
                      Add
                    </Button>
                  </form>
                )}

                {localTasks.length === 0 && !isAdmin && (
                  <EmptyState title="No onboarding tasks" description="You have no assigned onboarding tasks." />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Offboarding Protocol */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldOff size={16} className="text-[var(--rose)]" /> Offboarding Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] p-3">
                <AlertTriangle size={18} className="shrink-0 text-[var(--rose)]" />
                <p className="text-sm text-[var(--text-main)]">
                  Triggering offboarding will instantly mark the employee as Terminated, revoking system access, and automatically create high-priority Helpdesk tickets to reclaim company assets.
                </p>
              </div>

              <form onSubmit={handleOffboard} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Select Employee to Terminate</label>
                  <select
                    required
                    value={offboardUserId}
                    onChange={(e) => setOffboardUserId(e.target.value)}
                    className="ledger-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">Select someone…</option>
                    {users
                      ?.filter((u: { id: string; status?: string }) => u.id !== user.id && u.status !== 'Terminated')
                      .map((u: { id: string; name: string; department?: string }) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                      ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  disabled={triggerOffboarding.isPending || !offboardUserId}
                >
                  <AlertCircle size={16} /> Execute Offboarding
                </Button>
              </form>

              <div className="space-y-3 border-t border-[var(--border-hairline)] pt-4">
                <h4 className="text-sm font-semibold text-[var(--text-main)]">Finalize Severance</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Release final payout. This will fail if the employee has unreturned active IT assets.
                </p>
                <div className="flex gap-2">
                  <select
                    id="severanceUser"
                    className="ledger-input h-10 flex-1 rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">Select Terminated Employee…</option>
                    {users?.filter((u: { status?: string }) => u.status === 'Terminated').map((u: { id: string; name: string }) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const el = document.getElementById('severanceUser') as HTMLSelectElement;
                      if (el.value) finalizeSeverance.mutate({ userId: el.value });
                    }}
                    disabled={finalizeSeverance.isPending}
                  >
                    Release Funds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
