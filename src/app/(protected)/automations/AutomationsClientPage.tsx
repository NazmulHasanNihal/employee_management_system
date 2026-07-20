"use client";

import React, { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Pause, Trash2, Zap, ArrowRight, Check, ShieldAlert, Search } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';

type RuleStatus = 'Active' | 'Paused';

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  condition: string | null;
  action: string;
  status: RuleStatus;
  ownerId: string;
  lastRunAt: string | null;
  createdAt: string;
};

const TRIGGER_OPTIONS = ['employee.added', 'leave.requested', 'review.due', 'ticket.opened'];
const ACTION_OPTIONS = ['send_welcome', 'notify_manager', 'auto_approve_leave', 'create_ticket'];

export default function AutomationsClientPage() {
  const { user } = useUser();
  const isAdmin = user.role === 'Admin' || user.role === 'HR Manager';

  const utils = trpc.useUtils();
  const { data: list, isLoading } = trpc.automations.list.useQuery(undefined, { enabled: isAdmin });

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState('');

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger: '',
    action: '',
    status: 'Active' as RuleStatus,
  });

  useEffect(() => {
    if (list) setRules(list as AutomationRule[]);
  }, [list]);

  const createMutation = trpc.automations.create.useMutation({
    onSuccess: (created) => {
      if (created) setRules((prev) => [created as AutomationRule, ...prev]);
      setShowBuilder(false);
      setNewRule({ name: '', description: '', trigger: '', action: '', status: 'Active' });
      utils.automations.list.invalidate();
    },
  });

  const toggleMutation = trpc.automations.toggle.useMutation({
    onSuccess: (updated) => {
      if (updated) {
        setRules((prev) => prev.map((r) => (r.id === (updated as AutomationRule).id ? (updated as AutomationRule) : r)));
      }
      utils.automations.list.invalidate();
    },
  });

  const removeMutation = trpc.automations.remove.useMutation({
    onSuccess: (deleted) => {
      const id = (deleted as any)?.id ?? (deleted as any);
      if (id) setRules((prev) => prev.filter((r) => r.id !== id));
      utils.automations.list.invalidate();
    },
  });

  const toggleStatus = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const next: RuleStatus = rule.status === 'Active' ? 'Paused' : 'Active';
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    toggleMutation.mutate({ id, status: next });
  };

  const deleteRule = (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule? This action cannot be undone.')) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
    removeMutation.mutate({ id });
  };

  const saveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.trigger || !newRule.action) return;
    createMutation.mutate({
      name: newRule.name,
      description: newRule.description || undefined,
      trigger: newRule.trigger,
      condition: `${newRule.trigger} → ${newRule.action}`,
      action: newRule.action,
      status: newRule.status,
    });
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Access Denied"
          description="The Automation Engine requires HR authorization clearance."
          icon={<ShieldAlert size={24} />}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[var(--text-muted)] sm:px-6">
        Initializing Automation Engine…
      </div>
    );
  }

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.trigger.toLowerCase().includes(search.toLowerCase()) ||
      r.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Automation Engine"
        subtitle="Configure logical IF/THEN workflows to automate HR operations."
        icon={<Workflow size={20} />}
        actions={
          <Button onClick={() => setShowBuilder(!showBuilder)}>
            {showBuilder ? 'Cancel Workflow' : <><Plus size={16} /> Build Workflow</>}
          </Button>
        }
      />

      {showBuilder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={18} className="text-[var(--brand-strong)]" /> Logic Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={saveRule}>
              <div className="space-y-1">
                <Label className="text-[var(--text-muted)]">Workflow Name</Label>
                <Input
                  required
                  placeholder="e.g. Birthday Notifier"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[var(--text-muted)]">Description (optional)</Label>
                <Input
                  placeholder="Describe what this rule does"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6 md:grid-cols-[1fr_auto_1fr]">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-strong)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold">1</span>
                    Trigger (IF)
                  </p>
                  <select
                    required
                    value={newRule.trigger}
                    onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
                    className="ledger-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">Select Trigger Event…</option>
                    {TRIGGER_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="hidden justify-center md:flex">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-panel)] text-[var(--text-muted)]">
                    <ArrowRight size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--sky)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sky-soft)] text-xs font-bold">2</span>
                    Action (THEN)
                  </p>
                  <select
                    required
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                    className="ledger-input h-10 w-full rounded-xl px-3 text-sm outline-none"
                  >
                    <option value="">Select Executable Action…</option>
                    {ACTION_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text-muted)]">Initial Status</Label>
                <div className="flex gap-2">
                  {(['Active', 'Paused'] as RuleStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRule({ ...newRule, status: s })}
                      className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                        newRule.status === s
                          ? s === 'Active'
                            ? 'border-[var(--emerald)]/40 bg-[var(--emerald-soft)] text-[var(--emerald)]'
                            : 'border-[var(--amber)]/40 bg-[var(--amber-soft)] text-[var(--amber)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-panel)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!newRule.name || !newRule.trigger || !newRule.action || createMutation.isPending}
                className="w-full"
              >
                <Check size={16} /> {createMutation.isPending ? 'Deploying…' : 'Compile & Deploy Workflow'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
            <Workflow size={16} className="text-[var(--brand-strong)]" /> Active Logic Matrix
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules…"
              className="w-64 pl-9"
            />
          </div>
        </div>

        {filteredRules.length === 0 ? (
          <EmptyState
            title={rules.length === 0 ? 'No rules configured' : 'No rules match your search'}
            description={rules.length === 0 ? 'Build your first automation workflow to get started.' : undefined}
            icon={<Zap size={22} />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filteredRules.map((rule) => (
              <Card key={rule.id} className="relative overflow-hidden">
                <span
                  className={`absolute right-0 top-0 h-full w-1.5 ${
                    rule.status === 'Active' ? 'bg-[var(--emerald)]' : 'bg-[var(--amber)]'
                  }`}
                />
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--text-main)]">{rule.name}</h4>
                      {rule.description && <p className="text-xs text-[var(--text-muted)]">{rule.description}</p>}
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">UUID: {rule.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(rule.id)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                          rule.status === 'Active'
                            ? 'border-[var(--emerald)]/40 bg-[var(--emerald-soft)] text-[var(--emerald)] hover:bg-[var(--emerald)] hover:text-white'
                            : 'border-[var(--amber)]/40 bg-[var(--amber-soft)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-white'
                        }`}
                        title={rule.status === 'Active' ? 'Pause Rule' : 'Resume Rule'}
                      >
                        {rule.status === 'Active' ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--rose)]/40 bg-[var(--rose-soft)] text-[var(--rose)] transition-colors hover:bg-[var(--rose)] hover:text-white"
                        title="Delete Rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 text-sm">
                    <div className="flex items-start gap-4">
                      <span className="w-12 shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--brand-strong)]">IF</span>
                      <span className="rounded-lg border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-1.5 text-[var(--brand-strong)]">{rule.trigger}</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="w-12 shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--sky)]">THEN</span>
                      <span className="rounded-lg border border-[var(--sky)]/20 bg-[var(--sky-soft)] px-3 py-1.5 text-[var(--sky)]">{rule.action}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-3">
                    <Badge variant={rule.status === 'Active' ? 'emerald' : 'amber'}>
                      {rule.status === 'Active' ? <><span className="mr-1 h-2 w-2 rounded-full bg-[var(--emerald)]" />Active</> : 'Paused'}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                      Last run: {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
