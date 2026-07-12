"use client";

import React, { useState } from 'react';
import { Rocket, CheckSquare, ShieldOff, AlertTriangle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function OnboardingPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const [targetUserId, setTargetUserId] = useState(session?.user?.id || "");
  const [newTask, setNewTask] = useState("");
  const [offboardUserId, setOffboardUserId] = useState("");

  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: "" }, { enabled: isAdmin });
  const { data: tasks, isLoading } = trpc.workflows.getOnboardingTasks.useQuery(
    { userId: targetUserId }, 
    { enabled: !!targetUserId }
  );

  const utils = trpc.useUtils();
  const createTask = trpc.workflows.createTask.useMutation({
    onSuccess: () => {
      utils.workflows.getOnboardingTasks.invalidate();
      setNewTask("");
    }
  });

  const toggleTask = trpc.workflows.toggleTask.useMutation({
    onSuccess: () => utils.workflows.getOnboardingTasks.invalidate()
  });

  const triggerOffboarding = trpc.workflows.triggerOffboarding.useMutation({
    onSuccess: () => {
      alert("Offboarding triggered. Employee terminated and IT ticket created.");
      setOffboardUserId("");
    }
  });

  const triggerProbation = trpc.workflows.triggerProbationPlan.useMutation({
    onSuccess: () => {
      utils.workflows.getOnboardingTasks.invalidate();
      alert("Probation plan initialized (30/60/90 day check-ins).");
    }
  });

  const finalizeSeverance = trpc.workflows.finalizeSeverance.useMutation({
    onSuccess: (data) => {
      alert(data.message);
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !targetUserId) return;
    createTask.mutate({ userId: targetUserId, task: newTask });
  };

  const handleOffboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offboardUserId) return;
    if (confirm("Are you sure? This will terminate the employee and revoke access immediately.")) {
      triggerOffboarding.mutate({ userId: offboardUserId });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 text-transparent bg-clip-text flex items-center gap-3">
            <Rocket className="text-blue-400" size={32} />
            HR Workflows
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Automated Onboarding checklists and Offboarding protocols.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Onboarding Checklist */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute -right-10 -top-10 text-blue-500/10 group-hover:rotate-12 transition-transform duration-700">
            <CheckSquare size={150} />
          </div>
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
            <CheckSquare className="text-blue-400" size={24} /> Onboarding Checklist
          </h3>

          {isAdmin && (
            <div className="mb-6 relative z-10 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">View Checklist For:</label>
                <select 
                  value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none"
                >
                  <option value={session?.user?.id || ""}>Myself</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => targetUserId && triggerProbation.mutate({ userId: targetUserId })}
                disabled={!targetUserId || triggerProbation.isPending}
                className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-500 hover:text-white transition-colors h-10"
              >
                Init Probation Plan
              </button>
            </div>
          )}

          <div className="space-y-4 relative z-10">
            {isLoading ? (
              <div className="text-center text-[var(--text-muted)] py-4 font-mono text-sm animate-pulse">Loading tasks...</div>
            ) : (
              <>
                {tasks?.map(task => (
                  <div key={task.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${task.isCompleted ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/40 border-white/10 hover:border-white/30'}`}>
                    <input 
                      type="checkbox" 
                      checked={task.isCompleted} 
                      onChange={(e) => toggleTask.mutate({ id: task.id, isCompleted: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 text-blue-500 focus:ring-blue-500 bg-black/50"
                    />
                    <span className={`text-sm font-bold ${task.isCompleted ? 'text-blue-200 line-through' : 'text-white'}`}>
                      {task.task}
                    </span>
                  </div>
                ))}
                
                {isAdmin && (
                  <form onSubmit={handleAddTask} className="flex gap-2 mt-4">
                    <input 
                      type="text" required value={newTask} onChange={(e) => setNewTask(e.target.value)}
                      placeholder="New task..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                    <button type="submit" disabled={createTask.isPending} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:brightness-110">Add</button>
                  </form>
                )}
                
                {tasks?.length === 0 && !isAdmin && (
                  <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                    No onboarding tasks assigned.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Offboarding Protocol */}
        {isAdmin && (
          <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-[var(--alert-red)]/30 transition-colors">
            <div className="absolute -right-10 -top-10 text-[var(--alert-red)]/10 group-hover:rotate-12 transition-transform duration-700">
              <ShieldOff size={150} />
            </div>
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
              <ShieldOff className="text-[var(--alert-red)]" size={24} /> Offboarding Protocol
            </h3>

            <div className="p-4 bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/20 rounded-xl mb-6 relative z-10 flex gap-3">
              <AlertTriangle className="text-[var(--alert-red)] shrink-0" />
              <p className="text-sm text-red-200 leading-relaxed">
                Triggering offboarding will instantly mark the employee as Terminated, revoking system access, and automatically create high-priority Helpdesk tickets to reclaim company assets.
              </p>
            </div>

            <form onSubmit={handleOffboard} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Select Employee to Terminate</label>
                <select 
                  required value={offboardUserId} onChange={(e) => setOffboardUserId(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--alert-red)]/50 rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--alert-red)] focus:outline-none appearance-none"
                >
                  <option value="">Select someone...</option>
                  {users?.filter((u: any) => u.id !== session?.user?.id && u.status !== 'Terminated').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" disabled={triggerOffboarding.isPending || !offboardUserId}
                className="w-full bg-[var(--alert-red)] text-white py-3 rounded-lg font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              >
                <AlertCircle size={18} /> Execute Offboarding
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <h4 className="text-sm font-bold font-mono uppercase tracking-widest text-white mb-4">Finalize Severance</h4>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Release final payout. This will fail if the employee has unreturned active IT assets. Damaged assets will have their remaining depreciated value automatically deducted.
              </p>
              <div className="flex gap-2">
                <select 
                  id="severanceUser"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-[var(--ledger-blue)] focus:outline-none appearance-none"
                >
                  <option value="">Select Terminated Employee...</option>
                  {users?.filter((u: any) => u.status === 'Terminated').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => {
                    const el = document.getElementById('severanceUser') as HTMLSelectElement;
                    if (el.value) finalizeSeverance.mutate({ userId: el.value });
                  }}
                  disabled={finalizeSeverance.isPending}
                  className="bg-[var(--ledger-blue)] text-black px-4 py-2 rounded-lg font-bold font-mono uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
                >
                  Release Funds
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
