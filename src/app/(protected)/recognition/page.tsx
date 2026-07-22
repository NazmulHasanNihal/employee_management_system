import { Award, Star, Heart, Trophy, Crown } from 'lucide-react';
import { q } from '@/server/queries';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';
import RecognitionIsland from './RecognitionIsland';

export const dynamic = 'force-dynamic';

const CATEGORY_TONE: Record<string, string> = {
  Appreciation: 'text-[var(--emerald)] bg-[var(--emerald-soft)]',
  Teamwork: 'text-[var(--brand-strong)] bg-[var(--brand-soft)]',
  Leadership: 'text-[var(--amber)] bg-[var(--amber-soft)]',
  Innovation: 'text-[var(--sky)] bg-[var(--sky-soft)]',
  'Customer Love': 'text-[var(--rose)] bg-[var(--rose-soft)]',
};

export default async function RecognitionPage() {
  const [kudos, leaderboard] = await Promise.all([q.recentKudos(), q.kudoLeaderboard()]);

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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[var(--amber)]" /> Top Recognized
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No kudos awarded yet.</p>
              ) : (
                leaderboard.map((u: { userId: string; name: string; avatarUrl: string | null; count: number }, i: number) => (
                  <div key={u.userId} className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--amber-soft)] text-xs font-bold text-[var(--amber)]">{i + 1}</span>
                    <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-main)]">{u.name}</p>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{u.count} kudos</p>
                    </div>
                    <Star size={16} className="text-[var(--amber)]" />
                  </div>
                ))
              )}
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
              {kudos.map((kudo: { id: string; receiverName: string; senderAvatar: string | null; message: string; senderName: string; category: string; createdAt: Date }) => (
                <div key={kudo.id} className="relative overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 transition-all hover:border-[var(--amber)]/40 hover:shadow-md">
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${CATEGORY_TONE[kudo.category] || CATEGORY_TONE.Appreciation} border-current`}>{kudo.category}</Badge>
                      <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                        {new Date(kudo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
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
