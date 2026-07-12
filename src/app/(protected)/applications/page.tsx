"use client";

import React, { useState } from 'react';
import { Download, FileText, Check, X, Plus, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { downloadCSV } from '@/lib/utils';

export default function ApplicationsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as { id: string; name: string; email: string; role: string; department: string; designation: string } | undefined;
  const [showModal, setShowModal] = useState(false);
  const [newApp, setNewApp] = useState({ type: 'Leave Request', details: '' });

  const { data: apps, isLoading, refetch } = trpc.applications.list.useQuery(
    { userId: user?.role === 'Admin' ? undefined : user?.id },
    { enabled: !!user }
  );

  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setShowModal(false);
      setNewApp({ type: 'Leave Request', details: '' });
      refetch();
    }
  });

  const updateMutation = trpc.applications.updateStatus.useMutation({
    onSuccess: () => refetch()
  });

  if (isLoading || !user) {
    return <div className="p-8 text-center ledger-muted animate-pulse">Loading...</div>;
  }

  const handleUpdate = (id: string, status: string) => {
    updateMutation.mutate({ id, status });
  };

  const applicationsList = apps || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text">{user.role === 'Admin' ? 'Global Requests' : 'My Applications'}</h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">Formal Operations</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => downloadCSV(applicationsList, 'applications.csv')} className="btn-secondary px-4 py-2 flex items-center gap-2"><Download size={14} /> CSV</button>
          {user.role !== 'Admin' && <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 flex items-center gap-2"><Plus size={14} /> Submit Application</button>}
        </div>
      </div>

      <div className="ledger-panel">
        <div className="px-4 py-3 border-b ledger-border bg-[var(--bg-void)] flex items-center gap-2"><FileText size={14} className="text-[var(--ledger-blue)]"/><h3 className="font-mono text-xs font-bold ledger-text uppercase tracking-widest">Request Log</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap font-sans">
            <thead>
              <tr className="bg-[var(--bg-void)] border-b ledger-border">
                <th className="py-3 px-4 font-mono text-[10px] font-bold ledger-muted uppercase tracking-widest">Ref</th>
                <th className="py-3 px-4 font-mono text-[10px] font-bold ledger-muted uppercase tracking-widest">Type</th>
                {user.role === 'Admin' && <th className="py-3 px-4 font-mono text-[10px] font-bold ledger-muted uppercase tracking-widest">Applicant</th>}
                <th className="py-3 px-4 font-mono text-[10px] font-bold ledger-muted uppercase tracking-widest">Details</th>
                <th className="py-3 px-4 font-mono text-[10px] font-bold ledger-muted uppercase tracking-widest">Status</th>
                {user.role === 'Admin' && <th className="py-3 px-4 font-mono text-[10px] font-bold ledger-muted uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y ledger-border">
              {applicationsList.map((app) => (
                <tr key={app.id} className="table-row group">
                  <td className="py-3 px-4 text-[10px] font-mono ledger-muted">{app.id.slice(0, 8)}</td>
                  <td className="py-3 px-4 text-xs ledger-text font-bold uppercase tracking-wider">{app.type}</td>
                  {user.role === 'Admin' && <td className="py-3 px-4 text-xs ledger-text">{(app as { user?: { name: string } }).user?.name}</td>}
                  <td className="py-3 px-4 text-xs ledger-muted truncate max-w-[200px]">{app.details}</td>
                  <td className="py-3 px-4"><span className={`badge ${app.status.includes('Approved') ? 'text-[var(--verify-green)]' : app.status.includes('Rejected') ? 'text-[var(--alert-red)]' : 'text-[var(--signal-amber)]'}`}>{app.status}</span></td>
                  {user.role === 'Admin' && (
                    <td className="py-3 px-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {app.status.includes('Pending') && (
                        <>
                          <button onClick={() => handleUpdate(app.id, 'Approved')} className="p-1 text-[var(--verify-green)] hover:bg-[var(--verify-green)]/10 transition-colors"><Check size={14}/></button>
                          <button onClick={() => handleUpdate(app.id, 'Rejected')} className="p-1 text-[var(--alert-red)] hover:bg-[var(--alert-red)]/10 transition-colors"><X size={14}/></button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {applicationsList.length === 0 && (
            <div className="p-12 text-center text-xs font-sans ledger-muted">No applications found.</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="ledger-panel w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b ledger-border flex justify-between items-center bg-[var(--bg-void)]">
              <h3 className="font-mono text-sm font-bold ledger-text uppercase tracking-widest">New Protocol</h3>
              <button onClick={() => setShowModal(false)} className="ledger-muted hover:text-[var(--text-main)]"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-2">Application Type</label>
                <select className="w-full p-2 ledger-input text-xs" value={newApp.type} onChange={e => setNewApp({...newApp, type: e.target.value})}>
                  <option>Leave Request</option><option>Hardware Request</option><option>Expense Claim</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-2">Particulars</label>
                <textarea className="w-full p-2 ledger-input text-xs h-24 resize-none" value={newApp.details} onChange={e => setNewApp({...newApp, details: e.target.value})} placeholder="Specify details..."></textarea>
              </div>
              <button 
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                onClick={() => submitMutation.mutate({ userId: user.id, type: newApp.type, details: newApp.details })}
                disabled={!newApp.details || submitMutation.isPending}
              >
                <Send size={16} /> TRANSMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
