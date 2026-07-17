'use client';

import React, { useState } from 'react';
import { Shield, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusPill } from '@/components/ui/status-pill';

interface DelegationUser {
  proxyId?: string | null;
  proxyValidUntil?: string | Date | null;
  proxyName?: string | null;
}

export function DelegationSettings({ user }: { user: DelegationUser }) {
  const [proxyId, setProxyId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [active, setActive] = useState<DelegationUser>(user);

  const assign = () => {
    if (!proxyId) return;
    // Optimistic local state (proxy resolution happens server-side in legacy flow).
    setActive({ proxyId, proxyValidUntil: validUntil || null, proxyName: proxyId });
    setProxyId('');
    setValidUntil('');
  };

  const clear = () => setActive({ proxyId: null, proxyValidUntil: null, proxyName: null });

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
        <Shield size={15} className="text-[var(--brand-strong)]" /> Delegation Settings
      </h4>

      {active.proxyId ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] px-3 py-2">
          <div className="text-sm">
            <span className="font-medium text-[var(--emerald)]">Active Proxy:</span>{' '}
            <span className="text-[var(--text-main)]">{active.proxyName || active.proxyId}</span>
            <div className="text-xs text-[var(--text-muted)]">
              Valid until: {active.proxyValidUntil ? new Date(active.proxyValidUntil).toLocaleDateString() : 'Indefinite'}
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={clear} aria-label="Clear proxy">
            <X size={15} />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[var(--text-muted)]">Proxy User ID</Label>
            <Input
              value={proxyId}
              onChange={(e) => setProxyId(e.target.value)}
              placeholder="e.g. clabc123…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[var(--text-muted)]">Valid Until (Optional)</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="[color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <Button onClick={assign} disabled={!proxyId} className="w-full" size="sm">
            <UserPlus size={14} /> Assign Proxy
          </Button>
        </div>
      )}
    </div>
  );
}
