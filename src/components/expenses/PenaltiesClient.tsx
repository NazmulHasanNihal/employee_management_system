'use client';

import React, { useState } from 'react';
import { Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

interface PenaltiesClientProps {
  initialPenalties: any[];
  isAdmin: boolean;
}

export function PenaltiesClient({ initialPenalties, isAdmin }: PenaltiesClientProps) {
  const { user } = useUser();
  const [penalties, setPenalties] = useState<any[]>(initialPenalties || []);
  const utils = trpc.useUtils();

  const updatePenaltyStatus = trpc.expenses.updatePenaltyStatus.useMutation({
    onSuccess: () => {
      utils.invalidate('penalties');
      utils.invalidate('expenses');
    },
  });

  const totalUnpaid = penalties.filter((p) => p.status !== 'PAID').reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Unpaid Penalties</p>
            <p className="mt-2 text-fluid-3xl font-semibold text-[var(--rose)]">{formatCurrency(totalUnpaid, 'BDT', 'en')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Records</p>
            <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">{penalties.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ban className="h-4 w-4 text-[var(--rose)]" /> Penalty Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {penalties.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">You have no penalties. Keep up the great work! 🎉</p>
          ) : (
            <div className="space-y-3">
              {penalties.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rose-soft)] text-[var(--rose)]">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-main)]">{formatCurrency(p.amount, 'BDT', 'en')}</p>
                      <p className="text-xs text-[var(--text-muted)]">{p.reason}</p>
                      {p.dueDate && <p className="text-[10px] text-[var(--text-muted)]">Due: {new Date(p.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === 'PAID' ? (
                      <Badge variant="emerald" className="gap-1"><CheckCircle2 size={12} /> Paid</Badge>
                    ) : (
                      <Badge variant="rose" className="gap-1"><AlertTriangle size={12} /> Unpaid</Badge>
                    )}
                    {isAdmin && p.status !== 'PAID' && (
                      <button onClick={() => updatePenaltyStatus.mutate({ id: p.id, status: 'PAID' })} className="text-xs font-medium text-[var(--emerald)] hover:underline">Mark Paid</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
