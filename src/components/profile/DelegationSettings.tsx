"use client";

import React, { useState } from 'react';
import { Shield, UserPlus, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export function DelegationSettings({ user, addToast }: { user: any, addToast: (msg: string, type?: string) => void }) {
  const [proxyId, setProxyId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  
  const utils = trpc.useUtils();

  const { data: team } = trpc.team.getMyTeam.useQuery();
  
  // Actually, setting proxy to anyone? We might need a list of all users, but team might not have peers.
  // Let's assume we fetch some peers or just use an input for simplicity, or fetch users.
  // For now, let's use a query to get users if needed, but since it's a mock UI let's just do a simple text input for proxyId for now.
  // Better yet, a minimal list of active users.
  
  const setProxy = trpc.team.setProxy.useMutation({
    onSuccess: () => {
      addToast('Proxy assigned successfully', 'success');
      utils.team.getMyTeam.invalidate(); // Or whatever queries we need
      setProxyId('');
      setValidUntil('');
    }
  });

  const clearProxy = trpc.team.clearProxy.useMutation({
    onSuccess: () => {
      addToast('Proxy cleared', 'success');
    }
  });

  return (
    <div className="ledger-panel p-6">
      <h3 className="font-mono text-xs font-bold text-[var(--ledger-blue)] uppercase tracking-widest mb-6 flex items-center gap-2">
        <Shield size={16} /> Delegation Settings
      </h3>
      
      {user?.proxyId ? (
        <div className="space-y-4">
          <div className="p-3 border border-[var(--verify-green)] bg-[var(--verify-green)]/10 text-xs font-mono flex justify-between items-center">
            <div>
              <span className="text-[var(--verify-green)]">Active Proxy:</span> {user.proxyId}
              <br/>
              <span className="ledger-muted">Valid until: {user.proxyValidUntil ? new Date(user.proxyValidUntil).toLocaleDateString() : 'Indefinite'}</span>
            </div>
            <button 
              onClick={() => clearProxy.mutate()}
              className="p-2 hover:bg-[var(--alert-red)]/20 text-[var(--alert-red)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">Proxy User ID</label>
            <input 
              type="text" 
              value={proxyId}
              onChange={e => setProxyId(e.target.value)}
              className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-xs font-mono text-[var(--text-main)] focus:border-[var(--ledger-blue)] outline-none"
              placeholder="e.g. clabc123..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">Valid Until (Optional)</label>
            <input 
              type="date" 
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-xs font-mono text-[var(--text-main)] focus:border-[var(--ledger-blue)] outline-none [color-scheme:dark]"
            />
          </div>
          <button 
            onClick={() => {
              if (!proxyId) return addToast('Proxy ID is required', 'error');
              setProxy.mutate({ proxyId, validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 365*24*60*60*1000) });
            }}
            disabled={setProxy.isPending}
            className="w-full bg-[var(--ledger-blue)]/20 hover:bg-[var(--ledger-blue)]/30 text-[var(--ledger-blue)] border border-[var(--ledger-blue)]/50 p-2 text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={14} /> Assign Proxy
          </button>
        </div>
      )}
    </div>
  );
}
