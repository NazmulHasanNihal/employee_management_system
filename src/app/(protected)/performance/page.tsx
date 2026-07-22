import React from 'react';
import { Target, TrendingUp, Star } from 'lucide-react';
import { q } from '@/server/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { getServerT } from '@/lib/i18n-server';
import PerformanceIsland from './PerformanceIsland';
import { PromotionReadiness } from '@/components/performance/PromotionReadiness';

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const t = await getServerT();
  const [objectives, reviews, readiness] = await Promise.all([q.objectives(), q.reviews(), q.promotionReadiness()]);
  const typedReviews = reviews as { id: string; userId: string; reviewPeriod: string; rating: string; comments: string; reviewerName: string }[];

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Target className="h-5 w-5" />}
        title={t('Performance Hub')}
        subtitle={t('Objectives, Key Results & Managerial Feedback.')}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* OKRs Section */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--brand-strong)]" /> {t('Objective Tracker (OKRs)')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceIsland initialObjectives={objectives} />

              {(!objectives || objectives.length === 0) && (
                <EmptyState
                  title={t('No Active Objectives')}
                  description={t('Define your first objective to start tracking progress against your key results.')}
                  icon={<Target className="h-5 w-5" />}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Manager Reviews */}
        <div className="xl:col-span-1 space-y-6">
          <PromotionReadiness data={readiness} />

          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
              <Star className="h-4 w-4 text-[var(--amber)]" /> Manager Reviews
            </h3>
          </div>

          <div className="space-y-4">
            {typedReviews?.map((rev: { id: string; reviewPeriod: string; rating: string; comments: string; reviewerName: string }) => {
              const isExceeds = String(rev.rating).includes('Exceeds');
              return (
                <div key={rev.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--brand)]/40">
                  <div className="mb-3 flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{rev.reviewPeriod}</span>
                    <Badge variant={isExceeds ? 'amber' : 'emerald'}>{rev.rating}</Badge>
                  </div>
                  <p className="text-sm text-[var(--text-main)] italic leading-relaxed mb-4">&ldquo;{rev.comments}&rdquo;</p>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-hairline)]">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[10px] font-bold text-[var(--text-main)]">
                      {rev.reviewerName.charAt(0)}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">Reviewed by {rev.reviewerName}</span>
                  </div>
                </div>
              );
            })}
            {(!reviews || reviews.length === 0) && (
              <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)]/50 p-8 text-center text-sm text-[var(--text-muted)]">
                No formal reviews on record.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
