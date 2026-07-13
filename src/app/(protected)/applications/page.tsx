"use client";

import React, { useState } from 'react';
import { Download, FileText, Check, X, Plus, Send, Network, Server, Fingerprint } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill, StatusType } from '@/components/ui/status-pill';

export default function ApplicationsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';
  
  const [showModal, setShowModal] = useState(false);
  const [newApp, setNewApp] = useState({ type: 'Leave Request', details: '' });

  const [localApps, setLocalApps] = useState<any[]>([]);

  const { data: apps, isLoading, refetch } = trpc.applications.list.useQuery(
    { userId: isAdmin ? undefined : user?.id },
    { enabled: !!user }
  );

  React.useEffect(() => {
    if (apps) setLocalApps(apps);
  }, [apps]);

  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setShowModal(false);
      setNewApp({ type: 'Leave Request', details: '' });
      refetch();
    }
  });

  const updateMutation = trpc.applications.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: () => {
      if (apps) setLocalApps(apps);
    }
  });

  if (isLoading || !user) {
    return (
      <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-10 p-4 md:p-8">
        <Skeleton className="h-16 w-1/3 bg-white/5" />
        <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
      </div>
    );
  }

  const handleUpdate = (id: string, status: string) => {
    setLocalApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    updateMutation.mutate({ id, status });
  };

  const applicationsList = localApps || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Network className="text-[var(--ledger-blue)]" size={36} />
            Operations Hub
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            {isAdmin ? 'Global Request & Authorization Queue.' : 'My Formal Requests & Authorizations.'}
          </p>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0">
          <button 
            onClick={() => window.alert('CSV Download Triggered')} 
            className="bg-black/50 border border-white/10 text-white px-4 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:border-[var(--ledger-blue)] transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export
          </button>
          {!isAdmin && (
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-[var(--ledger-blue)] text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all flex items-center gap-2"
            >
              <Plus size={16} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-black/40 border-b border-white/10 p-6 flex justify-between items-center">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
            <Server size={16} className="text-[var(--text-muted)]" /> Authorization Ledger
          </h3>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-black/20 border-b border-white/10">
                <th className="py-4 px-6 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Trace ID</th>
                <th className="py-4 px-6 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Vector / Type</th>
                {isAdmin && <th className="py-4 px-6 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Origin Entity</th>}
                <th className="py-4 px-6 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Payload Details</th>
                <th className="py-4 px-6 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Clearance Status</th>
                {isAdmin && <th className="py-4 px-6 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Overrides</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {applicationsList.map((app: any) => (
                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-6 text-[10px] font-mono text-[var(--text-muted)]">{app.id.slice(0, 8)}</td>
                  <td className="py-4 px-6 text-xs text-white font-mono font-bold uppercase tracking-wider">{app.type}</td>
                  {isAdmin && <td className="py-4 px-6 text-xs text-white font-mono">{app.user?.name}</td>}
                  <td className="py-4 px-6 text-xs text-[var(--text-muted)] font-sans italic truncate max-w-[300px]">"{app.details}"</td>
                  <td className="py-4 px-6 text-center">
                    <StatusPill 
                      status={
                        app.status.includes('Approved') ? 'success' : 
                        app.status.includes('Rejected') ? 'error' : 
                        'pending'
                      } 
                      label={app.status} 
                    />
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6 text-right">
                      {app.status.includes('Pending') ? (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleUpdate(app.id, 'Approved')} className="bg-[var(--verify-green)]/20 text-[var(--verify-green)] p-2 rounded-lg hover:bg-[var(--verify-green)] hover:text-black transition-colors" title="Approve">
                            <Check size={14}/>
                          </button>
                          <button onClick={() => handleUpdate(app.id, 'Rejected')} className="bg-[var(--alert-red)]/20 text-[var(--alert-red)] p-2 rounded-lg hover:bg-[var(--alert-red)] hover:text-white transition-colors" title="Reject">
                            <X size={14}/>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {applicationsList.length === 0 && (
            <div className="p-16 text-center">
              <Network size={48} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
              <p className="text-sm font-mono text-[var(--text-muted)] uppercase tracking-widest">Operations Queue is Empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[var(--ledger-blue)]/50 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-[var(--ledger-blue)]/10 p-6 border-b border-[var(--ledger-blue)]/20 flex justify-between items-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ledger-blue)]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 relative z-10">
                <Fingerprint className="text-[var(--ledger-blue)]" size={18} /> Authorize New Request
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors relative z-10">
                <X size={20} />
              </button>
            </div>
            
            <form className="p-6 space-y-6" onSubmit={e => { e.preventDefault(); submitMutation.mutate(newApp); }}>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Request Vector</label>
                <select 
                  value={newApp.type} onChange={e => setNewApp({...newApp, type: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none appearance-none transition-colors"
                >
                  <option value="Leave Request">Leave / PTO</option>
                  <option value="Expense Claim">Expense Claim</option>
                  <option value="Hardware Upgrade">Hardware Upgrade</option>
                  <option value="Travel Authorization">Travel Authorization</option>
                  <option value="Access Request">System Access Request</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Payload Specifications</label>
                <textarea 
                  required rows={4} value={newApp.details} onChange={e => setNewApp({...newApp, details: e.target.value})}
                  placeholder="Provide detailed justification..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none resize-none transition-colors custom-scrollbar"
                />
              </div>

              <div className="pt-2">
                <button 
                  disabled={submitMutation.isPending || !newApp.details.trim()} type="submit" 
                  className="w-full bg-[var(--ledger-blue)] text-black px-6 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} /> Transmit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
