import React from 'react';
import { Lock, Inbox, ShieldCheck } from 'lucide-react';
import { q } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import FeedbackIsland, { FeedbackMarkReviewedButton } from './FeedbackIsland';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const allFeedback = isAdmin ? await q.allFeedback() : [];

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Lock className="h-5 w-5" />}
        title="Secure Drop"
        subtitle="Encrypted, anonymous channel for suggestions and concerns."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[var(--rose)]" /> Submit Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackIsland isAdmin={isAdmin} />
            </CardContent>
          </Card>
        </div>

        {/* Info or Admin View */}
        <div className="space-y-6">
          {!isAdmin ? (
            <Card className="h-full">
              <CardContent className="flex h-full flex-col items-center justify-center text-center">
                <ShieldCheck size={64} className="mb-6 text-[var(--rose)]/30" />
                <h3 className="mb-4 text-xl font-extrabold uppercase tracking-wide text-[var(--text-main)]">Zero-Knowledge Policy</h3>
                <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
                  When &ldquo;Ghost Mode&rdquo; is enabled, your identity is cryptographically decoupled from your submission. HR and management receive the contents of your message without any identifiable metadata.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                  <Inbox size={16} className="text-[var(--rose)]" /> Administrative Inbox
                </h3>
                <span className="rounded-full bg-[var(--bg-hover)] px-2 py-1 text-[10px] text-[var(--text-muted)]">{allFeedback?.length || 0} Messages</span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {(!allFeedback || allFeedback.length === 0) ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)]/50 p-12 text-center text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    Inbox is completely empty.
                  </div>
                ) : (
                  allFeedback.map((fb: { id: string; type: string; status: string; content: string; anonymous: boolean; createdAt: Date; category?: string; authorName?: string }) => (
                    <div key={fb.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--rose)]/30">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="rose">{fb.type || fb.category}</Badge>
                          <Badge variant={fb.status === 'NEW' ? 'amber' : 'emerald'}>{fb.status}</Badge>
                        </div>
                        <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="my-4 text-sm leading-relaxed text-[var(--text-main)]">&ldquo;{fb.content}&rdquo;</p>

                      <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-4 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--rose)]">
                          {fb.anonymous ? 'Anonymous Source' : `From: ${fb.authorName}`}
                        </span>
                        {fb.status === 'NEW' && (
                          <FeedbackMarkReviewedButton id={fb.id} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
