"use client";

import React, { useState } from 'react';
import { FileText, FileSignature, CheckCircle, Upload, File, Fingerprint, Clock, Download, ShieldCheck } from 'lucide-react';
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

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Accessing Encrypted Vault...</div>;
  }

  const pendingDocs = documents?.filter((d: any) => d.status === 'PENDING') || [];
  const completedDocs = documents?.filter((d: any) => d.status !== 'PENDING') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="text-blue-500" size={36} />
            E-Signature Vault
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Secure document distribution and cryptographic signatures.
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="mt-6 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2"
          >
            {showForm ? 'Cancel Upload' : <><Upload size={16} /> Distribute Document</>}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors -translate-y-1/2 translate-x-1/4" />
          
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4 relative z-10 flex items-center gap-2">
            <FileText size={16} className="text-blue-400" /> New Document Distribution
          </h3>
          
          <form className="space-y-6 relative z-10" onSubmit={e => { e.preventDefault(); createDocument.mutate(newDoc); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-widest mb-2">Document Title</label>
                <input 
                  type="text" required placeholder="e.g. Q4 NDA Agreement"
                  value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-widest mb-2">Assign Target Personnel</label>
                <select 
                  required value={newDoc.userId} onChange={e => setNewDoc({...newDoc, userId: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                >
                  <option value="">Select Employee ID...</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} - {u.designation}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <input 
                type="checkbox" id="reqSig"
                checked={newDoc.requiresSignature} onChange={e => setNewDoc({...newDoc, requiresSignature: e.target.checked})}
                className="w-5 h-5 rounded border-white/20 bg-black/50 accent-blue-500"
              />
              <label htmlFor="reqSig" className="text-xs font-mono font-bold uppercase text-white tracking-widest cursor-pointer select-none">
                Require Cryptographic E-Signature
              </label>
            </div>

            <button disabled={createDocument.isPending} type="submit" className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Upload size={18} /> Transmit File
            </button>
          </form>
        </div>
      )}

      {pendingDocs.length > 0 && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <h3 className="text-sm font-bold font-mono text-[var(--alert-red)] uppercase tracking-widest flex items-center gap-2">
            <Fingerprint size={16} /> Action Required (Awaiting Signature)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDocs.map((doc: any) => (
              <div key={doc.id} className="bg-white/5 backdrop-blur-xl border border-[var(--alert-red)]/50 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_15px_rgba(255,50,50,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--alert-red)]/5 to-transparent pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[var(--alert-red)]/10 rounded-xl flex items-center justify-center text-[var(--alert-red)] border border-[var(--alert-red)]/30">
                    <FileSignature size={24} />
                  </div>
                  <span className="bg-[var(--alert-red)]/20 text-[var(--alert-red)] px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest animate-pulse border border-[var(--alert-red)]/30">
                    Pending
                  </span>
                </div>
                
                <h4 className="font-bold text-white text-lg font-mono mb-2">{doc.name}</h4>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-6 flex items-center gap-1">
                  <Clock size={12}/> Received {new Date(doc.createdAt).toLocaleDateString()}
                </p>
                
                <button 
                  onClick={() => signDocument.mutate(doc.id)}
                  disabled={signDocument.isPending}
                  className="w-full bg-[var(--alert-red)] text-white py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Fingerprint size={14} /> Cryptographically Sign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
          <FileText size={16} className="text-blue-400" /> Vault Archive
        </h3>
        
        {completedDocs.length === 0 ? (
          <div className="py-12 text-center text-[10px] font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-3xl bg-black/20 uppercase tracking-widest">
            No documents in archive.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedDocs.map((doc: any) => (
              <div key={doc.id} className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 rounded-2xl p-6 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    doc.status === 'SIGNED' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30' : 'bg-white/5 text-[var(--text-muted)] border-white/10'
                  }`}>
                    {doc.status === 'SIGNED' ? <CheckCircle size={20} /> : <File size={20} />}
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest border ${
                    doc.status === 'SIGNED' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30' : 'bg-white/5 text-[var(--text-muted)] border-white/10'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                
                <h4 className="font-bold text-white text-base font-mono mb-2 truncate" title={doc.name}>{doc.name}</h4>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-6">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
                
                <button className="w-full bg-white/5 text-white/80 py-2 rounded-lg font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/10">
                  <Download size={14} /> Download PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
