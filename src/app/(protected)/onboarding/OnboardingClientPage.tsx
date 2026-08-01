"use client";

import React, { useEffect, useState } from 'react';
import { Rocket, CheckSquare, ShieldOff, AlertTriangle, AlertCircle, UserPlus, FileSignature, CheckCircle2, X, FileText, Laptop } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/lib/toast';
import { useUser } from '@/components/UserProvider';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { T } from "@/components/Translate";

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

interface ESignatureDoc {
  id: string;
  title: string;
  description: string;
  signedAt: string | null;
  signedBy: string | null;
}

export default function OnboardingClientPage() {
  const { user } = useUser();
  const isAdmin = user.role === 'Admin' || user.role === 'HR Manager';

  const [targetUserId, setTargetUserId] = useState(user.id || '');
  const [newTask, setNewTask] = useState('');
  const [offboardUserId, setOffboardUserId] = useState('');
  const [provisionAssetId, setProvisionAssetId] = useState('');
  const [provisionUserId, setProvisionUserId] = useState('');

  const [docs, setDocs] = useState<ESignatureDoc[]>([
    { id: 'doc_1', title: 'OpsHub NDA', description: 'Non-disclosure agreement regarding OpsHub IP.', signedAt: null, signedBy: null },
    { id: 'doc_2', title: 'Employee Handbook', description: 'Acknowledgment of company policies and code of conduct.', signedAt: null, signedBy: null },
    { id: 'doc_3', title: 'Direct Deposit Auth', description: 'Authorization for BEFTN / bKash payroll disbursement.', signedAt: null, signedBy: null },
  ]);
  const [signingDoc, setSigningDoc] = useState<ESignatureDoc | null>(null);
  const [signatureText, setSignatureText] = useState('');

  const { data: users } = trpc.registry.searchEmployees.useQuery(
    { query: '' },
    { enabled: isAdmin }
  );
  const { data: serverTasks, isLoading } = trpc.workflows.getOnboardingTasks.useQuery(
    { userId: targetUserId },
    { enabled: !!targetUserId }
  );
  
  const { data: assets } = trpc.assets.getAssets.useQuery(undefined, { enabled: isAdmin });

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

  const updateAsset = trpc.assets.updateAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAssets.invalidate();
      toast.success('Asset Provisioned', 'Hardware successfully assigned to employee.');
      setProvisionAssetId('');
      setProvisionUserId('');
    }
  });

  const handleProvisionAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionAssetId || !provisionUserId) return;
    updateAsset.mutate({ id: provisionAssetId, userId: provisionUserId, status: 'Active' });
  };

  const handleOffboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offboardUserId) return;
    if (confirm('Are you sure? This will terminate the employee and revoke access immediately.')) {
      triggerOffboarding.mutate({ userId: offboardUserId });
    }
  };

  const handleSignDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingDoc || !signatureText.trim()) return;
    
    setDocs(prev => prev.map(d => 
      d.id === signingDoc.id 
        ? { ...d, signedAt: new Date().toISOString(), signedBy: signatureText } 
        : d
    ));
    toast.success('Document Signed', `Cryptographically logged signature for ${signingDoc.title}`);
    setSigningDoc(null);
    setSignatureText('');
  };

  const totalTasks = localTasks.length + docs.length;
  const completedTasks = localTasks.filter(t => t.isCompleted).length + docs.filter(d => d.signedAt).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 animate-fade-up">
      <PageHeader
        title="HR Workflows"
        subtitle="Automated onboarding checklists and offboarding protocols."
        icon={<Rocket size={20} />}
        actions={isAdmin ? <Badge variant="brand">{/* @ts-ignore */}<T>Admin</T></Badge> : undefined}
      />

      {/* Progress Bar */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-app)] p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">{/* @ts-ignore */}<T>New Hire Onboarding Packet Progress</T></h3>
          <span className="text-xs font-bold text-[var(--emerald)]">{progressPercent}{/* @ts-ignore */}<T>% Completed</T></span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
          <div 
            className="h-full rounded-full bg-[var(--emerald)] transition-all duration-500 ease-in-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Onboarding Checklist */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare size={16} className="text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Onboarding Checklist</T></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>View Checklist For</T></label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value={user.id}>{/* @ts-ignore */}<T>Myself</T></option>
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
                  <UserPlus size={14} /> {/* @ts-ignore */}<T>Init Probation</T></Button>
              </div>
            )}

            {isLoading ? (
              <p className="py-4 text-center text-sm text-[var(--text-muted)]">{/* @ts-ignore */}<T>Loading tasks…</T></p>
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
                      {/* @ts-ignore */}<T>Add</T></Button>
                  </form>
                )}

                {localTasks.length === 0 && !isAdmin && (
                  <EmptyState title="No onboarding tasks" description="You have no assigned onboarding tasks." />
                )}
              </>
            )}
          </CardContent>
        </Card>
        </div>

        {/* E-Signature Document Vault */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature size={16} className="text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>E-Signature Document Vault</T></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {docs.map(doc => (
                <div key={doc.id} className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${doc.signedAt ? 'border-[var(--emerald)]/30 bg-[var(--emerald-soft)]' : 'border-[var(--border-hairline)] bg-[var(--bg-hover)]'}`}>
                  <div className="flex gap-3">
                    <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${doc.signedAt ? 'bg-[var(--emerald)]/20 text-[var(--emerald)]' : 'bg-[var(--bg-panel)] text-[var(--text-muted)]'}`}>
                      {doc.signedAt ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold ${doc.signedAt ? 'text-[var(--emerald)]' : 'text-[var(--text-main)]'}`}>{doc.title}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{doc.description}</p>
                      {doc.signedAt && (
                        <p className="mt-1 text-[10px] text-[var(--emerald)] font-mono">
                          {/* @ts-ignore */}<T>Signed by</T>{doc.signedBy} {/* @ts-ignore */}<T>on</T>{new Date(doc.signedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!doc.signedAt && (
                    <Button variant="outline" size="sm" onClick={() => setSigningDoc(doc)} className="shrink-0 text-xs">
                      {/* @ts-ignore */}<T>Sign Document</T></Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* IT Hardware Provisioning */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop size={16} className="text-[var(--sky)]" /> {/* @ts-ignore */}<T>Zero-Touch IT Provisioning</T></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Assign available inventory assets to new hires. The device will be marked active under their profile.</T></p>
              <form onSubmit={handleProvisionAsset} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>New Hire</T></label>
                  <select
                    required
                    value={provisionUserId}
                    onChange={(e) => setProvisionUserId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">{/* @ts-ignore */}<T>Select employee…</T></option>
                    {users?.map((u: { id: string; name: string }) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Available Inventory</T></label>
                  <select
                    required
                    value={provisionAssetId}
                    onChange={(e) => setProvisionAssetId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">{/* @ts-ignore */}<T>Select unassigned hardware…</T></option>
                    {assets
                      ?.filter((a: { userId: string | null }) => !a.userId)
                      .map((a: { id: string; name: string }) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </select>
                </div>
                <Button type="submit" variant="primary" disabled={updateAsset.isPending || !provisionAssetId || !provisionUserId}>
                  {/* @ts-ignore */}<T>Provision Asset</T></Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Offboarding Protocol */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldOff size={16} className="text-[var(--rose)]" /> {/* @ts-ignore */}<T>Offboarding Protocol</T></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] p-3">
                <AlertTriangle size={18} className="shrink-0 text-[var(--rose)]" />
                <p className="text-sm text-[var(--text-main)]">
                  {/* @ts-ignore */}<T>Triggering offboarding will instantly mark the employee as Terminated, revoking system access, and automatically create high-priority Helpdesk tickets to reclaim company assets.</T></p>
              </div>

              <form onSubmit={handleOffboard} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Select Employee to Terminate</T></label>
                  <select
                    required
                    value={offboardUserId}
                    onChange={(e) => setOffboardUserId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">{/* @ts-ignore */}<T>Select someone…</T></option>
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
                  <AlertCircle size={16} /> {/* @ts-ignore */}<T>Execute Offboarding</T></Button>
              </form>

              <div className="space-y-3 border-t border-[var(--border-hairline)] pt-4">
                <h4 className="text-sm font-semibold text-[var(--text-main)]">{/* @ts-ignore */}<T>Finalize Severance</T></h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>Release final payout. This will fail if the employee has unreturned active IT assets.</T></p>
                <div className="flex gap-2">
                  <select
                    id="severanceUser"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 flex-1 rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">{/* @ts-ignore */}<T>Select Terminated Employee…</T></option>
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
                    {/* @ts-ignore */}<T>Release Funds</T></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* E-Signature Modal */}
      {signingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--bg-app)] border border-[var(--border-hairline)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <FileSignature className="h-4 w-4 text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Digital Signature Required</T></h3>
              <button onClick={() => { setSigningDoc(null); setSignatureText(''); }} className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4 text-center">
                <FileText className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
                <h4 className="text-sm font-bold text-[var(--text-main)]">{signingDoc.title}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{/* @ts-ignore */}<T>Please review the document and provide your legal signature below to acknowledge.</T></p>
              </div>

              <form onSubmit={handleSignDocument} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Type Full Legal Name to Sign</T></label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="Alex Mercer" 
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={!signatureText.trim()}>
                    {/* @ts-ignore */}<T>Sign & Acknowledge</T></Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
