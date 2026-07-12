"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { ShieldAlert, FileSignature, Award } from 'lucide-react';

export default function CompliancePage() {
  const { data: session } = authClient.useSession();
  const utils = trpc.useUtils();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'HR Manager';
  
  const { data: expiringCerts, isLoading: loadingCerts } = trpc.compliance.getExpiringCertifications.useQuery(undefined, { enabled: isAdmin });
  const { data: whistleblowerReports, isLoading: loadingReports } = trpc.compliance.getWhistleblowerReports.useQuery(undefined, { enabled: userRole === 'Admin' });
  const { data: myCerts } = trpc.compliance.getMyCertifications.useQuery();
  
  const [activeTab, setActiveTab] = useState<'CERTS' | 'WHISTLEBLOWER'>('CERTS');
  const [newCert, setNewCert] = useState({ name: '', expiryDate: '' });
  
  const addCert = trpc.compliance.addCertification.useMutation({
    onSuccess: () => {
      utils.compliance.getMyCertifications.invalidate();
      setNewCert({ name: '', expiryDate: '' });
    }
  });

  const submitReport = trpc.compliance.submitWhistleblower.useMutation({
    onSuccess: () => {
      alert("Report submitted anonymously.");
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border shrink-0">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text flex items-center gap-2">
            <ShieldAlert size={24} className="text-[var(--alert-red)]" /> Compliance & Integrity
          </h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            Corporate Governance Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('CERTS')} className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${activeTab === 'CERTS' ? 'bg-[var(--ledger-blue)] text-black' : 'border ledger-border hover:bg-[var(--bg-panel)]'}`}>Certifications</button>
          <button onClick={() => setActiveTab('WHISTLEBLOWER')} className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${activeTab === 'WHISTLEBLOWER' ? 'bg-[var(--alert-red)] text-black' : 'border ledger-border hover:bg-[var(--bg-panel)]'}`}>Whistleblower</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar space-y-6">
        
        {activeTab === 'CERTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ledger-panel p-4 bg-[var(--bg-panel)] space-y-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Award size={16} /> My Certifications</h3>
              <form className="space-y-2 border-b ledger-border pb-4" onSubmit={e => { e.preventDefault(); addCert.mutate(newCert); }}>
                <input required type="text" placeholder="Certification Name" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]" />
                <input required type="date" value={newCert.expiryDate} onChange={e => setNewCert({...newCert, expiryDate: e.target.value})} className="w-full bg-[var(--bg-void)] border ledger-border p-2 text-sm font-mono focus:border-[var(--ledger-blue)]" />
                <button disabled={addCert.isPending} type="submit" className="w-full bg-[var(--ledger-blue)] text-black px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest">Add Certification</button>
              </form>
              <ul className="space-y-2">
                {myCerts?.map((cert: any) => (
                  <li key={cert.id} className="flex justify-between items-center p-2 border ledger-border">
                    <span className="text-xs font-mono">{cert.name}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Exp: {new Date(cert.expiryDate!).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isAdmin && (
              <div className="ledger-panel p-4 bg-[var(--bg-panel)] space-y-4 border-[var(--alert-red)]">
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-[var(--alert-red)]"><ShieldAlert size={16} /> Expiring Soon (30 Days)</h3>
                {loadingCerts ? <p className="text-xs font-mono">Loading...</p> : (
                  <ul className="space-y-2">
                    {expiringCerts?.map((cert: any) => (
                      <li key={cert.id} className="p-3 border border-[var(--alert-red)] bg-[var(--alert-red)]/10">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-[var(--alert-red)]">{cert.user.name}</span>
                          <span className="text-[10px] font-mono text-[var(--alert-red)]">Exp: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] font-mono mt-1">{cert.name}</p>
                      </li>
                    ))}
                    {expiringCerts?.length === 0 && <p className="text-xs font-mono text-[var(--text-muted)]">No certifications expiring soon.</p>}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'WHISTLEBLOWER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="ledger-panel p-4 bg-[var(--bg-panel)] space-y-4 border-[var(--alert-red)]">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-[var(--alert-red)]"><ShieldAlert size={16} /> Submit Anonymous Report</h3>
              <p className="text-[10px] font-mono text-[var(--text-muted)]">Reports submitted here are strictly anonymous. No user data is attached to the database record. Reports are sent directly to Executive Management.</p>
              <form onSubmit={e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const msg = (form.elements.namedItem('msg') as HTMLTextAreaElement).value;
                submitReport.mutate({ message: msg });
                form.reset();
              }} className="space-y-2">
                <textarea required name="msg" placeholder="Describe the compliance violation, safety hazard, or harassment issue in detail..." className="w-full bg-[var(--bg-void)] border border-[var(--alert-red)] p-2 text-sm font-mono h-32 resize-none"></textarea>
                <button type="submit" className="w-full bg-[var(--alert-red)] text-black px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest">Submit Securely</button>
              </form>
            </div>

            {userRole === 'Admin' && (
              <div className="ledger-panel p-4 bg-[var(--bg-panel)] space-y-4">
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2">Executive Inbox</h3>
                {loadingReports ? <p className="text-xs font-mono">Loading...</p> : (
                  <ul className="space-y-4">
                    {whistleblowerReports?.map((report: any) => (
                      <li key={report.id} className="p-3 border ledger-border bg-[var(--bg-void)]">
                        <div className="flex justify-between text-[10px] font-mono text-[var(--alert-red)] mb-2">
                          <span>ANONYMOUS</span>
                          <span>{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs">{report.message}</p>
                      </li>
                    ))}
                    {whistleblowerReports?.length === 0 && <p className="text-xs font-mono text-[var(--text-muted)]">Inbox empty.</p>}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
