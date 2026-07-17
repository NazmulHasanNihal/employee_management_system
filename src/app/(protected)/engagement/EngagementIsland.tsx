'use client';

import React, { useState } from 'react';
import { Cake, CalendarHeart, PartyPopper, Sparkles, Bell, BellOff } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';

interface Upcoming {
  id: string;
  name: string;
  kind: 'birthday' | 'anniversary';
  date: string;
  tenureYears?: number;
  avatarUrl?: string | null;
}
interface Rule {
  id: string;
  kind: string;
  channel: string;
  messageTemplate: string;
  isActive: boolean;
}
interface History {
  id: string;
  kind: string;
  message: string;
  sentAt: string;
}

interface EngagementIslandProps {
  initialRules: Rule[];
  initialHistory: History[];
  initialUpcoming: Upcoming[];
  canManage: boolean;
}

const KIND_ICON = { birthday: Cake, anniversary: CalendarHeart, festival: PartyPopper };

export default function EngagementIsland({ initialRules, initialHistory, initialUpcoming, canManage }: EngagementIslandProps) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [upcoming, setUpcoming] = useState<Upcoming[]>(initialUpcoming);
  const [history, setHistory] = useState<History[]>(initialHistory);

  const setRuleActive = trpc.engagement.setRuleActive.useMutation({
    onSuccess: (u: any) => {
      setRules((prev) => prev.map((r) => (r.id === (u as any).id ? (u as Rule) : r)));
      trpc.useUtils().engagement.greetings.invalidate();
    },
  });

  const birthdays = upcoming.filter((u) => u.kind === 'birthday');
  const anniversaries = upcoming.filter((u) => u.kind === 'anniversary');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingCard title="Upcoming Birthdays" icon={Cake} color="rose" items={birthdays} />
        <UpcomingCard title="Work Anniversaries" icon={CalendarHeart} color="brand" items={anniversaries} />
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles size={16} className="text-[var(--brand-strong)]" /> Greeting Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No greeting rules configured.</p>
            ) : (
              rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold capitalize text-[var(--text-main)]">
                      {React.createElement(KIND_ICON[r.kind as keyof typeof KIND_ICON] || Sparkles, { size: 14 })} {r.kind} greetings
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">channel: {r.channel}</p>
                  </div>
                  <button
                    aria-label={`Toggle ${r.kind} greetings`}
                    onClick={() => setRuleActive.mutate({ id: r.id, isActive: !r.isActive })}
                    className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors ${r.isActive ? 'border-[var(--emerald)]/40 bg-[var(--emerald-soft)] text-[var(--emerald)]' : 'border-[var(--border-hairline)] bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}
                  >
                    {r.isActive ? <Bell size={14} /> : <BellOff size={14} />}
                    {r.isActive ? 'Active' : 'Off'}
                  </button>
                </div>
              ))
            )}
            <p className="text-xs text-[var(--text-muted)]">
              Greetings are delivered daily by the <code className="rounded bg-[var(--bg-hover)] px-1">/api/cron/greetings</code> job. Contact an admin to wire an external cron.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PartyPopper size={16} className="text-[var(--amber)]" /> Recent Greetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title="No greetings sent yet" description="Greetings will appear here once the daily job runs." icon={<PartyPopper size={22} />} />
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-3">
                  <div className="flex items-center gap-2">
                    {React.createElement(KIND_ICON[h.kind as keyof typeof KIND_ICON] || Sparkles, { size: 14, className: 'text-[var(--brand-strong)]' })}
                    <span className="text-sm text-[var(--text-main)]">{h.message}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{new Date(h.sentAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingCard({ title, icon: Icon, color, items }: { title: string; icon: any; color: string; items: Upcoming[] }) {
  const ring = color === 'rose' ? 'border-[var(--rose)]/30' : 'border-[var(--brand)]/30';
  const iconColor = color === 'rose' ? 'text-[var(--rose)]' : 'text-[var(--brand-strong)]';
  return (
    <Card className={ring}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon size={16} className={iconColor} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nothing scheduled in the next 30 days.</p>
        ) : (
          <div className="space-y-3">
            {items.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-3">
                <Avatar src={u.avatarUrl} name={u.name} className="h-9 w-9" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text-main)]">{u.name}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {new Date(u.date).toLocaleDateString()} {u.tenureYears ? `· ${u.tenureYears} yrs` : ''}
                  </p>
                </div>
                {u.kind === 'birthday' ? <Badge variant="rose">Birthday</Badge> : <Badge variant="brand">Anniversary</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
