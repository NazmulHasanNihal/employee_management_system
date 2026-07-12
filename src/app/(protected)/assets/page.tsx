"use client";

import React, { useState } from 'react';
import { Laptop, Activity, Plus, Check, X, ShieldAlert, Monitor, Cpu, Keyboard } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function AssetsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.permissions?.includes('MANAGE_ASSETS');

  const utils = trpc.useUtils();
  const { data: assets, isLoading } = trpc.assets.getAssets.useQuery();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin });

  const [showCreate, setShowCreate] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', status: 'Active', userId: '' });

  const createMutation = trpc.assets.createAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAssets.invalidate();
      setShowCreate(false);
      setNewAsset({ name: '', status: 'Active', userId: '' });
    }
  });

  const updateMutation = trpc.assets.updateAsset.useMutation({
    onSuccess: () => utils.assets.getAssets.invalidate()
  });

  if (isLoading || !user) return <div className="p-8 text-center text-white/50 animate-pulse font-mono">Loading IT Assets...</div>;

  const getIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('macbook') || l.includes('laptop') || l.includes('thinkpad')) return <Laptop size={20} className="text-[var(--ledger-blue)]" />;
    if (l.includes('monitor') || l.includes('display')) return <Monitor size={20} className="text-[var(--ledger-blue)]" />;
    if (l.includes('keyboard') || l.includes('mouse')) return <Keyboard size={20} className="text-[var(--ledger-blue)]" />;
    return <Cpu size={20} className="text-[var(--ledger-blue)]" />;
  };

  const calculateDepreciation = (asset: any) => {
    if (!asset.purchasePrice || !asset.purchaseDate) return null;
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const depPerYear = asset.purchasePrice / (asset.depreciationYears || 3);
    const currentValue = Math.max(0, asset.purchasePrice - (depPerYear * yearsElapsed));
    return currentValue.toFixed(2);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-[var(--alert-red)]/5 blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Cpu className="text-[var(--ledger-blue)]" size={28} /> IT Asset Management
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            Hardware Inventory & Assignments
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="bg-white/5 border border-white/10 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 rounded-lg backdrop-blur-sm"
          >
            <Plus size={14} /> {showCreate ? 'Cancel' : 'New Asset'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-6">
        
        {showCreate && isAdmin && (
          <div className="bg-white/5 backdrop-blur-lg border border-[var(--ledger-blue)]/50 p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-4">Provision Hardware</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Device Name / Model</label>
                <input 
                  type="text" placeholder="MacBook Pro M3 Max"
                  value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Purchase Price ($)</label>
                <input 
                  type="number" step="0.01" min="0" placeholder="e.g. 2500"
                  onChange={e => setNewAsset({...newAsset, purchasePrice: parseFloat(e.target.value)} as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Purchase Date</label>
                <input 
                  type="date"
                  onChange={e => setNewAsset({...newAsset, purchaseDate: new Date(e.target.value)} as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Assign To (Optional)</label>
                <select 
                  value={newAsset.userId} onChange={e => setNewAsset({...newAsset, userId: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] appearance-none"
                >
                  <option value="">Unassigned (Inventory)</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Status</label>
                <select 
                  value={newAsset.status} onChange={e => setNewAsset({...newAsset, status: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Repair Needed">Repair Needed</option>
                  <option value="Damaged">Damaged (Severance Deduction)</option>
                  <option value="Decommissioned">Decommissioned</option>
                </select>
              </div>
            </div>
            <button 
              disabled={createMutation.isPending || !newAsset.name}
              onClick={() => createMutation.mutate(newAsset)}
              className="mt-4 bg-[var(--ledger-blue)] text-black px-6 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_15px_var(--ledger-blue)] transition-all flex items-center gap-2"
            >
              {createMutation.isPending ? <Activity size={14} className="animate-spin" /> : 'Log Asset'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets?.map((asset: any) => (
            <div key={asset.id} className={`bg-black/40 backdrop-blur-md border rounded-2xl p-6 relative group overflow-hidden transition-colors flex flex-col ${
              (asset.status === 'Repair Needed' || asset.status === 'Damaged') ? 'border-[var(--alert-red)]/30 hover:border-[var(--alert-red)]/60' :
              asset.status === 'Decommissioned' ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-[var(--ledger-blue)]/30'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    {getIcon(asset.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{asset.name}</h3>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">ID: {asset.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-mono uppercase px-2 py-1 rounded-full border ${
                  asset.status === 'Active' ? 'text-[var(--verify-green)] border-[var(--verify-green)]/30 bg-[var(--verify-green)]/10' :
                  (asset.status === 'Repair Needed' || asset.status === 'Damaged') ? 'text-[var(--alert-red)] border-[var(--alert-red)]/30 bg-[var(--alert-red)]/10' :
                  'text-[var(--text-muted)] border-white/20 bg-white/5'
                }`}>
                  {asset.status}
                </span>
              </div>

              {asset.purchasePrice && (
                <div className="mb-4 pt-2 pb-2 border-t border-b border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Initial Value</p>
                    <p className="text-xs font-mono font-bold text-white">${asset.purchasePrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Depreciated Value</p>
                    <p className="text-xs font-mono font-bold text-[var(--alert-red)]">${calculateDepreciation(asset)}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/5 flex-1 flex flex-col justify-end">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-2">Assigned To</p>
                {asset.user ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] border border-white/20">
                      {asset.user.name.charAt(0)}
                    </div>
                    {asset.user.name}
                  </div>
                ) : (
                  <div className="text-sm font-mono text-[var(--signal-amber)] italic">
                    Unassigned (In Inventory)
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4 flex gap-2 pt-4 border-t border-white/5">
                  <select 
                    className="flex-1 bg-black/60 border border-white/10 rounded p-1 text-[10px] font-mono text-white appearance-none"
                    value={asset.userId || ''}
                    onChange={(e) => updateMutation.mutate({ id: asset.id, status: asset.status, userId: e.target.value === '' ? null : e.target.value })}
                  >
                    <option value="">Unassign</option>
                    {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <select 
                    className="flex-1 bg-black/60 border border-white/10 rounded p-1 text-[10px] font-mono text-white appearance-none"
                    value={asset.status}
                    onChange={(e) => updateMutation.mutate({ id: asset.id, status: e.target.value, userId: asset.userId })}
                  >
                    <option value="Active">Active</option>
                    <option value="Repair Needed">Repair Needed</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
              )}
            </div>
          ))}
          {(!assets || assets.length === 0) && (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl">
              <Cpu size={48} className="mx-auto text-white/10 mb-4" />
              <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-widest">No hardware assets found in inventory.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
