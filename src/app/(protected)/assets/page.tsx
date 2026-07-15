"use client";

import React, { useState } from 'react';
import { Laptop, Activity, Plus, Check, X, ShieldAlert, Monitor, Cpu, Keyboard, TrendingDown, Clock, Search } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { EmptyState } from '@/components/EmptyState';

export default function AssetsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.permissions?.includes('MANAGE_ASSETS');

  const utils = trpc.useUtils();
  const { data: assets, isLoading } = trpc.assets.getAssets.useQuery();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin });

  const [showCreate, setShowCreate] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', status: 'Active', userId: '' });
  const [searchQuery, setSearchQuery] = useState('');

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

  if (isLoading || !user) return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Scanning Hardware Network...</div>;

  const getIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('macbook') || l.includes('laptop') || l.includes('thinkpad')) return <Laptop size={32} />;
    if (l.includes('monitor') || l.includes('display')) return <Monitor size={32} />;
    if (l.includes('keyboard') || l.includes('mouse') || l.includes('keychron')) return <Keyboard size={32} />;
    return <Cpu size={32} />;
  };

  const calculateDepreciation = (asset: any) => {
    if (!asset.purchasePrice || !asset.purchaseDate) return { current: 0, depAmount: 0 };
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const depPerYear = asset.purchasePrice / (asset.depreciationYears || 3);
    const currentValue = Math.max(0, asset.purchasePrice - (depPerYear * yearsElapsed));
    return {
      current: currentValue.toFixed(2),
      depAmount: (asset.purchasePrice - currentValue).toFixed(2)
    };
  };

  const filteredAssets = assets?.filter((a: any) => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Fleet Stats
  const totalAssets = assets?.length || 0;
  const totalValue = assets?.reduce((acc: number, curr: any) => acc + (curr.purchasePrice || 0), 0) || 0;
  const currentFleetValue = assets?.reduce((acc: number, curr: any) => acc + parseFloat(calculateDepreciation(curr).current as any), 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-[var(--signal-amber)]/5 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Cpu className="text-[var(--ledger-blue)]" size={36} />
            IT Fleet
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Global Hardware Inventory & Assignments.
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--ledger-blue)] transition-colors" size={16} />
            <input 
              type="text" placeholder="Search fleet..." 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="bg-black/50 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none transition-colors w-64"
            />
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-[var(--ledger-blue)] text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all flex items-center gap-2"
            >
              {showCreate ? 'Cancel' : <><Plus size={16} /> Provision Asset</>}
            </button>
          )}
        </div>
      </div>

      {/* Fleet Dashboard */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2">Total Fleet Size</h4>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-4xl font-mono font-black text-white">{totalAssets}</span>
              <span className="text-sm font-mono text-[var(--text-muted)] uppercase mb-1">Units</span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-[var(--verify-green)]/20 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/5 to-transparent pointer-events-none" />
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity size={14} className="text-[var(--verify-green)]" /> Original Value
            </h4>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-4xl font-mono font-black text-white">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-[var(--alert-red)]/20 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--alert-red)]/5 to-transparent pointer-events-none" />
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingDown size={14} className="text-[var(--alert-red)]" /> Current Book Value
            </h4>
            <div className="flex items-end gap-3 mt-4">
              <span className="text-4xl font-mono font-black text-[var(--alert-red)]">${currentFleetValue.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>
            </div>
          </div>
        </div>
      )}

      {showCreate && isAdmin && (
        <div className="bg-white/5 backdrop-blur-xl border border-[var(--ledger-blue)]/50 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-4 z-20">
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Provision Hardware</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Device Name / Model</label>
              <input 
                type="text" placeholder="e.g. MacBook Pro M3 Max"
                value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Purchase Price ($)</label>
              <input 
                type="number" step="0.01" min="0" placeholder="2500.00"
                onChange={e => setNewAsset({...newAsset, purchasePrice: parseFloat(e.target.value)} as any)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Purchase Date</label>
              <input 
                type="date"
                onChange={e => setNewAsset({...newAsset, purchaseDate: new Date(e.target.value)} as any)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Assign To</label>
              <select 
                value={newAsset.userId} onChange={e => setNewAsset({...newAsset, userId: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none appearance-none"
              >
                <option value="">Unassigned (Inventory)</option>
                {users?.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => createMutation.mutate(newAsset as any)}
                disabled={createMutation.isPending || !newAsset.name}
                className="w-full bg-[var(--ledger-blue)] text-black py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50"
              >
                Execute Provisioning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!filteredAssets || filteredAssets.length === 0) ? (
          <div className="col-span-full">
            <EmptyState 
              title="No Hardware Assets Found" 
              description="There are no active hardware assignments or inventory items in this registry." 
              actionText={isAdmin ? "Provision Asset" : undefined}
              onAction={isAdmin ? () => setShowCreate(true) : undefined}
            />
          </div>
        ) : (
          filteredAssets.map((asset: any) => {
            const dep = calculateDepreciation(asset);
            
            return (
              <div key={asset.id} className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[var(--ledger-blue)]/50 transition-colors rounded-3xl p-6 relative overflow-hidden group">
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--ledger-blue)]/10 text-[var(--ledger-blue)] flex items-center justify-center border border-[var(--ledger-blue)]/30">
                      {getIcon(asset.name)}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${
                    asset.status === 'Active' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30 shadow-[0_0_10px_rgba(0,255,100,0.2)]' :
                    asset.status === 'Maintenance' ? 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30 shadow-[0_0_10px_var(--signal-amber)] animate-pulse' :
                    'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(255,0,0,0.2)]'
                  }`}>
                    {asset.status}
                  </span>
                </div>
                
                <h4 className="text-xl font-bold text-white font-mono mb-4">{asset.name}</h4>
                
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Assigned Personnel</p>
                  <p className="text-sm font-bold text-white">{asset.user?.name || <span className="text-[var(--signal-amber)] italic">Unassigned (Inventory)</span>}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={10}/> Acquired</p>
                    <p className="text-xs font-mono text-white">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Book Value</p>
                    <p className={`text-sm font-mono font-black ${dep.current === '0.00' ? 'text-[var(--alert-red)]' : 'text-white'}`}>
                      ${dep.current || 'N/A'}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-2">
                    <select 
                      value={asset.status}
                      onChange={(e) => updateMutation.mutate({ id: asset.id, status: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-mono text-white focus:border-[var(--ledger-blue)] outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
