"use client";

import React, { useState } from 'react';
import { FileText, FileSignature, CheckCircle, Upload, File } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function DocumentsPage() {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'HR Manager';

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.documents.getDocuments.useQuery();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin });

  const signDocument = trpc.documents.signDocument.useMutation({
    onSuccess: () => utils.documents.getDocuments.invalidate()
  });

  const createDocument = trpc.documents.createDocument.useMutation({
    onSuccess: () => {
      utils.documents.getDocuments.invalidate();
      setShowForm(false);
      setNewDoc({ name: '', userId: '', requiresSignature: false });
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', userId: '', requiresSignature: false });

  if (isLoading) return <div className="p-8 text-center ledger-muted animate-pulse font-mono">Loading Documents...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <FileText className="text-[var(--ledger-blue)]" size={28} /> Document Center
          </h2>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            Compliance & E-Signatures
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-white/5 border border-white/10 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 rounded-lg backdrop-blur-sm"
          >
            <Upload size={14} /> {showForm ? 'Cancel' : 'Upload Document'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4">
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); createDocument.mutate(newDoc); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-muted)] mb-2">Document Name</label>
                <input 
                  type="text" required placeholder="e.g. 2026 NDA"
                  value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--text-muted)] mb-2">Assign To Employee</label>
                <select 
                  required value={newDoc.userId} onChange={e => setNewDoc({...newDoc, userId: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] transition-colors appearance-none"
                >
                  <option value="">Select Employee...</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" id="reqSig"
                checked={newDoc.requiresSignature} onChange={e => setNewDoc({...newDoc, requiresSignature: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-[var(--ledger-blue)] focus:ring-[var(--ledger-blue)]"
              />
              <label htmlFor="reqSig" className="text-xs font-mono uppercase text-[var(--text-muted)] cursor-pointer">Requires E-Signature</label>
            </div>
            <button disabled={createDocument.isPending} type="submit" className="bg-[var(--ledger-blue)] text-black px-6 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_15px_var(--ledger-blue)] transition-all">
              Distribute Document
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents?.map((doc: any) => (
            <div key={doc.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative group overflow-hidden hover:border-white/20 transition-colors shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500 text-white">
                <File size={100} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">{doc.name}</h3>
                  {isAdmin && <p className="text-xs text-[var(--text-muted)] font-mono">Assigned to: {doc.user.name}</p>}
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  
                  {doc.requiresSignature ? (
                    doc.isSigned ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-[var(--verify-green)] bg-[var(--verify-green)]/10 px-3 py-1 rounded-full border border-[var(--verify-green)]/30">
                        <CheckCircle size={14} /> Signed {new Date(doc.signedAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <button 
                        onClick={() => signDocument.mutate({ documentId: doc.id })}
                        disabled={signDocument.isPending || (isAdmin && doc.userId !== (session?.user as any)?.id)}
                        className="flex items-center gap-2 text-xs font-mono font-bold text-black bg-[var(--signal-amber)] px-4 py-2 rounded-lg hover:shadow-[0_0_15px_var(--signal-amber)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileSignature size={14} /> Sign Now
                      </button>
                    )
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--text-muted)] px-3 py-1 rounded-full border border-white/10">
                      Standard Doc
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!documents || documents.length === 0) && (
            <div className="col-span-full py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl">
              No documents in the system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
