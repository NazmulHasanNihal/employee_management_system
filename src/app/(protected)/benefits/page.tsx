import React from 'react';
import { HeartHandshake, Sparkles, Gem, Activity, Landmark, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { q } from '@/server/queries';
import { getServerT } from '@/lib/i18n-server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function BenefitsPage() {
  const t = await getServerT();
  const [benefits, equity, enrollmentPeriod] = await Promise.all([
    q.employeeBenefits(),
    q.equityGrants(),
    q.activeEnrollmentPeriod(),
  ]);

  const equityGrants = equity || [];
  const vestedValue = equityGrants.reduce((sum: number, g: { vestedShares: number; currentStrikePrice: number }) => sum + (g.vestedShares * g.currentStrikePrice), 0);
  const totalValue = equityGrants.reduce((sum: number, g: { totalShares: number; currentStrikePrice: number }) => sum + (g.totalShares * g.currentStrikePrice), 0);

  const benefitIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('health') || n.includes('medical') || n.includes('insurance')) return <HeartHandshake size={24} />;
    if (n.includes('401k') || n.includes('retire') || n.includes('pension')) return <Landmark size={24} />;
    if (n.includes('wellness') || n.includes('gym') || n.includes('fitness')) return <Activity size={24} />;
    return <Sparkles size={24} />;
  };
  const benefitVariant = (name: string): 'rose' | 'sky' | 'emerald' => {
    const n = name.toLowerCase();
    if (n.includes('health') || n.includes('medical') || n.includes('insurance')) return 'rose';
    if (n.includes('401k') || n.includes('retire') || n.includes('pension')) return 'sky';
    return 'emerald';
  };

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<HeartHandshake className="h-5 w-5" />}
        title={t('Benefits & Equity')}
        subtitle={t('Perks, Insurance, and Stock Vesting Dashboard.')}
      />

      {/* Enrollment Alert */}
      {enrollmentPeriod ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--emerald)]/15 text-[var(--emerald)]">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--emerald)]">{enrollmentPeriod.name} is Active</h3>
              <p className="mt-1 text-sm text-[var(--text-main)]">
                Make your selections before the deadline on <span className="font-bold">{new Date(enrollmentPeriod.endDate).toLocaleDateString()}</span>.
              </p>
            </div>
          </div>
          <Button variant="primary" className="shrink-0" disabled title="Enrollment portal opens during an active window">{enrollmentPeriod ? 'Enter Portal' : 'Enrollment Closed'}</Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] p-4">
          <AlertCircle className="text-[var(--rose)]" size={20} />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--rose)]">Enrollment Closed</h3>
            <p className="text-xs text-[var(--text-muted)]">Benefits cannot be modified outside of an active enrollment window or qualifying life event.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equity Section */}
        <div className="space-y-6">
          <h3 className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-sm font-semibold text-[var(--text-main)]">
            <TrendingUp size={16} className="text-[var(--brand-strong)]" /> Vested Equity
          </h3>

          <Card>
            {equityGrants.length > 0 ? (
              <CardContent>
                <div className="mb-8">
                  <p className="mb-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Estimated Current Value (Vested)</p>
                  <h4 className="flex items-center gap-2 text-5xl font-extrabold tracking-tight text-[var(--text-main)]">
                    ৳{vestedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h4>
                  <p className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--brand-strong)]">
                    <Activity size={12} /> {equityGrants.length} grant{equityGrants.length > 1 ? 's' : ''} on record
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Total Grant Options</p>
                       <p className="text-lg font-bold text-[var(--text-main)]">{equityGrants.reduce((s: number, g: { totalShares: number }) => s + g.totalShares, 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Total Potential Value</p>
                      <p className="text-lg font-bold text-[var(--text-main)]">৳{totalValue.toLocaleString()}</p>
                    </div>
                  </div>

                  {equityGrants.map((g: { id: string; totalShares: number; vestedShares: number; currentStrikePrice: number; grantDate: Date }) => (
                    <div key={g.id} className="flex justify-between items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Vested Shares</p>
                        <p className="text-lg font-bold text-[var(--emerald)]">{g.vestedShares.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Grant Date</p>
                        <p className="text-sm font-bold text-[var(--text-main)]">{new Date(g.grantDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <EmptyState
                  title="No active equity grants"
                  description="You don't have any equity grants on record yet."
                  icon={<Gem className="h-5 w-5" />}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Perks Section */}
        <div className="space-y-6">
          <h3 className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-sm font-semibold text-[var(--text-main)]">
            <Gem size={16} className="text-[var(--emerald)]" /> Active Perks
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {benefits?.map((eb: { id: string; status: string; benefit: { id: string; name: string; description?: string; provider?: string } }) => (
              <div key={eb.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--emerald)]/30 md:flex-row md:items-center">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${benefitVariant(eb.benefit.name) === 'rose' ? 'bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]/30' : benefitVariant(eb.benefit.name) === 'sky' ? 'bg-[var(--sky-soft)] text-[var(--sky)] border-[var(--sky)]/30' : 'bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/30'}`}>
                    {benefitIcon(eb.benefit.name)}
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-semibold text-[var(--text-main)]">{eb.benefit.name}</h4>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{eb.benefit.description}</p>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-strong)]">
                      Provider: {eb.benefit.provider || 'Internal'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-start md:items-end">
                  <Badge variant={eb.status === 'ENROLLED' ? 'emerald' : 'amber'}>{eb.status}</Badge>
                </div>
              </div>
            ))}
            {(!benefits || benefits.length === 0) && (
              <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)]/50 p-12 text-center text-sm text-[var(--text-muted)]">
                No active benefits found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
