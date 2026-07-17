'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PerformanceIslandProps {
  initialObjectives: any[];
}

export default function PerformanceIsland({ initialObjectives }: PerformanceIslandProps) {
  const { user } = useUser();
  const [newTitle, setNewTitle] = useState('');

  const utils = trpc.useUtils();
  const createObj = trpc.performance.createObjective.useMutation({
    onSuccess: () => utils.performance.getObjectives.invalidate(),
  });

  const updateObj = trpc.performance.updateObjectiveProgress.useMutation({
    onSuccess: () => utils.performance.getObjectives.invalidate(),
  });

  // Prefill the trpc cache so optimistic interactions are consistent with server data.
  trpc.performance.getObjectives.useQuery(undefined, {
    initialData: initialObjectives,
  });

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createObj.mutate({ userId: user.id, title: newTitle });
    setNewTitle('');
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 size={14} className="text-[var(--emerald)]" />;
    if (status === 'At Risk') return <AlertCircle size={14} className="text-[var(--rose)]" />;
    return <Clock size={14} className="text-[var(--amber)]" />;
  };

  const getStatusVariant = (status: string): 'emerald' | 'rose' | 'amber' => {
    if (status === 'Completed') return 'emerald';
    if (status === 'At Risk') return 'rose';
    return 'amber';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddObjective} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="text"
          placeholder="Define new objective..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button
          type="submit"
          disabled={createObj.isPending || !newTitle.trim()}
          className="shrink-0"
        >
          <Plus size={16} /> Add OKR
        </Button>
      </form>

      <div className="space-y-3">
        {initialObjectives?.map((obj: any) => (
          <div key={obj.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--brand)]/30">
            <div className="mb-4 flex justify-between items-center">
              <span className="font-semibold text-[var(--text-main)] text-sm md:text-base">{obj.title}</span>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(obj.status)}
                <span className="text-xs">{obj.status}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 rounded-full overflow-hidden bg-[var(--bg-hover)] border border-[var(--border-hairline)]">
                <div
                  className="h-full bg-[var(--brand)] transition-all duration-1000 ease-out"
                  style={{ width: `${obj.progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--text-main)] w-12 text-right">{obj.progress}%</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Update progress:</span>
              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateObj.mutate({ id: obj.id, progress: val })}
                  disabled={updateObj.isPending}
                  className="rounded-md border border-[var(--border-hairline)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text-main)]"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
