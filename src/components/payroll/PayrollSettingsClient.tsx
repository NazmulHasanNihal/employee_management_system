'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Bitcoin, Plus, Save } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PayrollSettingsClientProps {
  heads: any[];
  structures: any[];
}

export function PayrollSettingsClient({ heads, structures }: PayrollSettingsClientProps) {
  const router = useRouter();
  // `heads`/`structures` are server props; trpc invalidation would be a no-op.
  // Refresh the server Component so the new head/structure appears immediately.
  const refresh = () => router.refresh();

  const createHeadMutation = trpc.payroll.createHead.useMutation({
    onSuccess: () => {
      refresh();
      setNewHeadName('');
    },
  });

  const createStructureMutation = trpc.payroll.createStructure.useMutation({
    onSuccess: () => {
      refresh();
      setStructureForm(false);
    },
  });

  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadType, setNewHeadType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');
  const [structureForm, setStructureForm] = useState(false);
  const [sName, setSName] = useState('');
  const [sBase, setSBase] = useState(5000);

  const headList = heads || [];
  const structList = structures || [];

  const handleCreateHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName) return;
    createHeadMutation.mutate({ name: newHeadName, type: newHeadType });
  };

  const handleCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName) return;
    createStructureMutation.mutate({ name: sName, baseSalary: sBase, heads: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setStructureForm((s) => !s)}>
          {structureForm ? 'Cancel Creation' : <><Plus className="h-4 w-4" /> New Structure</>}
        </Button>
      </div>

      {structureForm && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[var(--amber)]" /> Salary Structure Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateStructure}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Matrix Designation
                  </label>
                  <Input
                    required
                    placeholder="e.g. Executive Package"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    Baseline Anchor (৳)
                  </label>
                  <Input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={sBase}
                    onChange={(e) => setSBase(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={createStructureMutation.isPending || !sName}>
                <Save className="h-4 w-4" /> Compile Matrix
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-[var(--amber)]" /> Global Heads
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleCreateHead} className="space-y-3">
              <Input
                required
                placeholder="New Head (e.g. Tax)"
                value={newHeadName}
                onChange={(e) => setNewHeadName(e.target.value)}
              />
              <div className="flex gap-3">
                <select
                  value={newHeadType}
                  onChange={(e) => setNewHeadType(e.target.value as 'EARNING' | 'DEDUCTION')}
                  className="ledger-input flex-1"
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
                <Button type="submit" variant="secondary" size="icon" disabled={!newHeadName}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="flex-1 space-y-2">
              {headList.map((h: any) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3"
                >
                  <span className="text-sm text-[var(--text-main)]">{h.name}</span>
                  <Badge variant={h.type === 'EARNING' ? 'emerald' : 'rose'}>{h.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {structList.length === 0 ? (
            <EmptyStateLocal />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {structList.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-main)]">{s.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">Matrix ID: {s.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[var(--bg-hover)] p-4">
                      <span className="text-xs text-[var(--text-muted)]">Anchor Base</span>
                      <span className="text-sm font-semibold text-[var(--text-main)]">
                        ৳{(s.baseSalary ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyStateLocal() {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
      <Layers className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
      <h3 className="text-sm font-semibold text-[var(--text-muted)]">No Active Matrices</h3>
    </div>
  );
}
