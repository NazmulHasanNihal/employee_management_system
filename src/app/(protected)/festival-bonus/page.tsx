import React from 'react';
import { Gift } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { getFestivalBonuses } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import { getLanguage } from '@/lib/i18n-server';
import { FestivalBonusClient } from '@/components/payroll/FestivalBonusClient';

export const dynamic = 'force-dynamic';

export default async function FestivalBonusPage() {
  const caller = await requireAdmin();
  const isAdmin = true;
  const lang = await getLanguage();
  const bonuses = await getFestivalBonuses(caller);

  const totalPaid = bonuses.filter((b: { status: string }) => b.status === 'PAID').reduce((sum: number, b: { amount?: number }) => sum + (b.amount || 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="Festival Bonus"
        subtitle="Bangladesh festival bonuses (Eid, Puja, etc.) per Labour Act."
        icon={<Gift className="h-5 w-5" />}
        actions={isAdmin ? <FestivalBonusClient bonuses={bonuses} isAdmin={isAdmin} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Bonus Paid</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-main)]">{formatCurrency(totalPaid, 'BDT', 'en')}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{bonuses.length} record(s)</p>
          </CardContent>
        </Card>
      </div>

      {bonuses.length === 0 ? (
        <EmptyState title="No festival bonuses yet" description="Admins can grant festival bonuses from the action bar above." />
      ) : (
        <Card>
          <CardHeader><CardTitle>Festival Bonus Register</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bonuses.map((b: { id: string; user?: { name: string }; occasion: string; occasionBn: string | null; year: number; amount: number; status: string }) => (
                <div key={b.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                  <div>
                    <p className="font-semibold text-[var(--text-main)]">{b.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--text-muted)]">{(lang === 'bn' && b.occasionBn ? b.occasionBn : b.occasion)} — {b.year}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-[var(--amber)]">{formatCurrency(b.amount, 'BDT', 'en')}</span>
                    <Badge variant={b.status === 'PAID' ? 'emerald' : 'amber'}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
