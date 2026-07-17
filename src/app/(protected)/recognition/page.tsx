import React from 'react';
import { Trophy, Award, Heart } from 'lucide-react';
import { q } from '@/server/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import RecognitionIsland from './RecognitionIsland';

export const dynamic = 'force-dynamic';

export default async function RecognitionPage() {
  const kudos = await q.recentKudos();

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<Trophy className="h-5 w-5" />}
        title="Hall of Fame"
        subtitle="Publicly recognize and celebrate your colleagues."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send Kudo Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[var(--amber)]" /> Give a Shoutout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecognitionIsland />
            </CardContent>
          </Card>
        </div>

        {/* Kudos Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
              <Award size={16} className="text-[var(--text-muted)]" /> Recent Accolades
            </h3>
          </div>

          {(!kudos || kudos.length === 0) ? (
            <EmptyState
              title="No shoutouts yet"
              description="Be the first to recognize a colleague for great work!"
              icon={<Heart className="h-5 w-5" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kudos.map((kudo: any) => (
                <div key={kudo.id} className="relative overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 transition-colors hover:border-[var(--amber)]/40">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="mb-1 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">To</p>
                      <p className="text-lg font-semibold text-[var(--text-main)]">{kudo.receiverName}</p>
                    </div>
                    <Avatar src={kudo.senderAvatar} name={kudo.senderName} size="sm" className="ring-1 ring-[var(--amber)]/30" />
                  </div>

                  <div className="relative mb-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
                    <Heart size={16} className="absolute right-4 top-4 text-[var(--rose)]/40" />
                    <p className="pr-8 text-sm italic leading-relaxed text-[var(--text-main)]">&ldquo;{kudo.message}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-4 mt-auto">
                    <div>
                      <p className="mb-0.5 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">From</p>
                      <p className="text-xs font-bold text-[var(--brand-strong)]">{kudo.senderName}</p>
                    </div>
                    <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                      {new Date(kudo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
