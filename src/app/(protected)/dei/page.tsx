import React from 'react';
import { Scale, AlertCircle, CheckCircle2, TrendingDown, TrendingUp, BarChart3, Users, DollarSign } from 'lucide-react';
import { q } from '@/server/queries';
import { requireAdmin } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import BiasChart from './BiasChartDynamic';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DEIPage() {
  await requireAdmin();

  const audit = await q.biasAudit();
  const analysisData = audit?.analysis || [];
  const globalAvg = audit?.overallAvgSalary || 0;
  const totalFlags = analysisData.filter((a: { biasFlag: boolean }) => a.biasFlag).length;

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Scale className="h-5 w-5" />}
        title="Equity & Bias Scanner"
        subtitle="Automated intelligence identifying systemic pay discrepancies."
      />

      <div className={`flex flex-col items-center justify-between gap-6 rounded-3xl border p-8 shadow-2xl md:flex-row ${totalFlags === 0 ? 'border-[var(--emerald)]/30 bg-[var(--emerald-soft)]' : 'border-[var(--rose)]/30 bg-[var(--rose-soft)]'}`}>
        <div className="flex items-center gap-6">
          {totalFlags === 0 ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--emerald)]/50 bg-[var(--emerald-soft)]">
              <CheckCircle2 className="text-[var(--emerald)]" size={40} />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--rose)]/50 bg-[var(--rose-soft)]">
              <AlertCircle className="animate-pulse text-[var(--rose)]" size={40} />
            </div>
          )}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Global Audit Status</p>
            {totalFlags === 0 ? (
              <h3 className="text-3xl font-extrabold text-[var(--text-main)]">No Systemic Bias Detected</h3>
            ) : (
              <h3 className="text-3xl font-extrabold text-[var(--text-main)]">{totalFlags} Discrepancy Flags Found</h3>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 text-center md:text-right">
          <p className="mb-1 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] md:justify-end">
            <DollarSign size={12} /> Global Base Salary Average
          </p>
          <p className="text-3xl font-bold tracking-tight text-[var(--text-main)]">
            {formatCurrency(globalAvg, 'BDT', 'en')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-2">
        <BarChart3 size={16} className="text-[var(--brand-strong)]" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">Demographic Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {analysisData.map((group: { group: string; headcount: number; avgSalary: number; deviation: number; biasFlag: boolean }) => (
          <Card key={group.group} className={group.biasFlag ? 'border-[var(--rose)]/40' : ''}>
            <CardContent>
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-2xl font-extrabold text-[var(--text-main)]">{group.group}</h3>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-3 py-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] w-fit">
                    <Users size={12} /> Headcount: {group.headcount}
                  </div>
                </div>
                {group.biasFlag ? (
                  <Badge variant="rose" className="animate-pulse"><AlertCircle size={14} /> Flagged</Badge>
                ) : (
                  <Badge variant="emerald"><CheckCircle2 size={14} /> Clear</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-5">
                  <p className="mb-2 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Group Average</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xl font-bold ${group.biasFlag ? 'text-[var(--rose)]' : 'text-[var(--text-main)]'}`}>
                      {formatCurrency(Math.round(group.avgSalary), 'BDT', 'en')}
                    </p>
                    {group.avgSalary > globalAvg ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                        <TrendingUp size={12} />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rose-soft)] text-[var(--rose)]">
                        <TrendingDown size={12} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-5">
                  <p className="mb-2 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Deviation</p>
                  <p className="text-xl font-bold text-[var(--text-main)]">
                    {((group.avgSalary / globalAvg - 1) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analysisData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[var(--brand-strong)]" /> Salary Distribution by Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BiasChart analysis={analysisData} globalAvg={globalAvg} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
