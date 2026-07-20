'use client';

import React, { useState } from 'react';
import { Plus, Download, Gift } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { downloadCSV, toFestivalBonusCsv } from '@/lib/export';

interface Props {
  bonuses: any[];
  isAdmin: boolean;
}

export function FestivalBonusClient({ bonuses, isAdmin }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [occasion, setOccasion] = useState('Eid-ul-Fitr');
  const [occasionBn, setOccasionBn] = useState('ঈদ-উল-ফিতর');
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');

  const utils = trpc.useUtils();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: showForm });
  // Live list (seeded with server prop) so granting refreshes in place.
  const { data: bonusData } = trpc.payroll.getFestivalBonuses.useQuery(undefined, { initialData: bonuses });
  const liveBonuses = (bonusData as any[] | undefined) ?? bonuses;

  const grant = trpc.payroll.grantFestivalBonus.useMutation({
    onSuccess: () => { utils.payroll.getFestivalBonuses.invalidate(); setShowForm(false); setUserId(''); setAmount(''); },
  });

  const exportCsv = () => {
    if (liveBonuses.length === 0) return;
    downloadCSV('festival_bonus.csv', toFestivalBonusCsv(liveBonuses));
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> Grant Bonus
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="animate-scale-in rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]"><Gift className="h-4 w-4 text-[var(--amber)]" /> Grant Festival Bonus</h3>
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              grant.mutate({
                userId,
                occasion,
                occasionBn,
                year: Number(year),
                amount: amount ? Number(amount) : undefined,
                status: 'PAID',
              });
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Employee</label>
              <select required className="ledger-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">-- Select --</option>
                {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Occasion (EN)</label>
              <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Occasion (BN)</label>
              <Input value={occasionBn} onChange={(e) => setOccasionBn(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Year</label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Amount (BDT, leave blank = 1 month basic)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Auto = 1 month basic salary" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={grant.isPending || !userId}>{grant.isPending ? 'Granting...' : 'Grant Bonus'}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
