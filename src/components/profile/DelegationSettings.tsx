'use client';

import React, { useState } from 'react';
import { Shield, UserPlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setProxy } from '@/app/actions/profile';

interface DelegationUser {
  proxyId?: string | null;
  proxyValidUntil?: string | Date | null;
  proxyName?: string | null;
}

export function DelegationSettings({ user }: { user: DelegationUser }) {
  const [proxyId, setProxyId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [active, setActive] = useState<DelegationUser>(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = async () => {
    if (!proxyId) return;
    setSaving(true);
    setError(null);
    try {
      await setProxy(proxyId, validUntil || null);
      // Optimistically reflect the change; the server resolved proxyId is echoed back.
      setActive({ proxyId, proxyValidUntil: validUntil || null, proxyName: proxyId });
      setProxyId('');
      setValidUntil('');
    } catch (e: any) {
      setError(e?.message || 'Failed to assign proxy');
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    setError(null);
    try {
      await setProxy(null);
      setActive({ proxyId: null, proxyValidUntil: null, proxyName: null });
    } catch (e: any) {
      setError(e?.message || 'Failed to clear proxy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
        <Shield size={15} className="text-[var(--brand-strong)]" /> Delegation Settings
      </h4>

      {error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">{error}</p>
      )}

      {active.proxyId ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] px-3 py-2">
          <div className="text-sm">
            <span className="font-medium text-[var(--emerald)]">Active Proxy:</span>{' '}
            <span className="text-[var(--text-main)]">{active.proxyName || active.proxyId}</span>
            <div className="text-xs text-[var(--text-muted)]">
              Valid until: {active.proxyValidUntil ? new Date(active.proxyValidUntil).toLocaleDateString() : 'Indefinite'}
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={clear} disabled={saving} aria-label="Clear proxy">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
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
          <Button onClick={assign} disabled={!proxyId || saving} className="w-full" size="sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Assign Proxy
          </Button>
        </div>
      )}
    </div>
  );
}
