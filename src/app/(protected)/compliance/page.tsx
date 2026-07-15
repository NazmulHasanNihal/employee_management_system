"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';
import { ShieldAlert, Award, AlertTriangle, EyeOff, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

export default function CompliancePage() {
  const { data: session } = authClient.useSession();
  const utils = trpc.useUtils();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'Admin' || userRole === 'HR Manager';
  
  const { data: expiringCerts, isLoading: loadingCerts } = trpc.compliance.getExpiringCertifications.useQuery(undefined, { enabled: isAdmin });
  const { data: myCerts } = trpc.compliance.getMyCertifications.useQuery();
  
  const [activeTab, setActiveTab] = useState<'CERTS' | 'WHISTLEBLOWER'>('CERTS');
  const [newCert, setNewCert] = useState({ name: '', expiryDate: '' });
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  
  const addCert = trpc.compliance.addCertification.useMutation({
    onSuccess: () => {
      utils.compliance.getMyCertifications.invalidate();
      setNewCert({ name: '', expiryDate: '' });
    }
  });

  const submitReport = trpc.compliance.submitWhistleblower.useMutation({
    onSuccess: () => {
      setReportText("");
      setReportSubmitted(true);
      setTimeout(() => setReportSubmitted(false), 4000);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--alert-red)]/10 to-[var(--ledger-blue)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="text-[var(--alert-red)]" size={36} />
            Governance
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Compliance Tracking & Integrity Reporting.
          </p>
        </div>
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 mt-6 md:mt-0">
          <button 
            onClick={() => setActiveTab('CERTS')} 
            className={`px-6 py-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${activeTab === 'CERTS' ? 'bg-[var(--ledger-blue)] text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Certifications
          </button>
          <button 
            onClick={() => setActiveTab('WHISTLEBLOWER')} 
            className={`px-6 py-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'WHISTLEBLOWER' ? 'bg-[var(--alert-red)] text-white shadow-[0_0_15px_rgba(255,50,50,0.4)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <EyeOff size={14}/> Whistleblower
          </button>
        </div>
      </div>

      {activeTab === 'CERTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-500">
          
          <div className="space-y-6">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
              <Award size={16} className="text-[var(--ledger-blue)]" /> My Compliance Portfolio
            </h3>
            
            <div className="bg-white/5 backdrop-blur-xl border border-[var(--ledger-blue)]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ledger-blue)]/5 rounded-full blur-3xl group-hover:bg-[var(--ledger-blue)]/10 transition-colors -translate-y-1/2 translate-x-1/4" />
              
              <form className="space-y-4 mb-8 relative z-10" onSubmit={e => { e.preventDefault(); addCert.mutate(newCert); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    required type="text" placeholder="Certification Title" 
                    value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none transition-colors" 
                  />
                  <input 
                    required type="date" 
                    value={newCert.expiryDate} onChange={e => setNewCert({...newCert, expiryDate: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] outline-none transition-colors" 
                  />
                </div>
                <button 
                  disabled={addCert.isPending || !newCert.name || !newCert.expiryDate} type="submit" 
                  className="w-full bg-[var(--ledger-blue)] text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50"
                >
                  Register Certification
                </button>
              </form>
              
              <div className="space-y-3 relative z-10">
                {(!myCerts || myCerts.length === 0) ? (
                  <div className="py-8 text-center text-[10px] font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-xl bg-black/20 uppercase tracking-widest">
                    No active certifications.
                  </div>
                ) : (
                  myCerts.map((cert: any) => {
                    const daysLeft = Math.ceil((new Date(cert.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    const isExpiring = daysLeft <= 30;
                    return (
                      <div key={cert.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center group-hover:border-white/10 transition-colors">
                        <div>
                          <p className="font-bold text-white text-sm font-mono">{cert.name}</p>
                          <p className={`text-[10px] font-mono uppercase tracking-widest mt-1 ${isExpiring ? 'text-[var(--alert-red)]' : 'text-[var(--text-muted)]'}`}>
                            Exp: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <ShieldCheck size={20} className={isExpiring ? 'text-[var(--alert-red)] animate-pulse' : 'text-[var(--verify-green)]'} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold font-mono text-[var(--alert-red)] uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
                <AlertTriangle size={16} /> Audit: Expiring Soon (&lt; 30 Days)
              </h3>
              
              <div className="bg-black/20 border border-[var(--alert-red)]/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(255,50,50,0.05)]">
                {loadingCerts ? (
                  <div className="text-center text-[var(--text-muted)] py-12 font-mono text-[10px] uppercase tracking-widest animate-pulse">Running Compliance Scan...</div>
                ) : (
                  <div className="space-y-4">
                    {(!expiringCerts || expiringCerts.length === 0) ? (
                      <div className="py-12 flex flex-col items-center justify-center text-[10px] font-mono text-[var(--verify-green)] uppercase tracking-widest">
                        <CheckCircle size={32} className="mb-3 opacity-50" />
                        All Personnel Fully Compliant.
                      </div>
                    ) : (
                      expiringCerts.map((cert: any) => (
                        <div key={cert.id} className="bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/30 rounded-xl p-4 hover:bg-[var(--alert-red)]/20 transition-colors flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                              {cert.user.name} 
                              <span className="text-[9px] bg-black/50 text-[var(--alert-red)] px-2 py-0.5 rounded-full border border-[var(--alert-red)]/20">Critical</span>
                            </h4>
                            <p className="text-[10px] font-mono text-white/70 mt-1 uppercase tracking-widest">{cert.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[9px] font-mono text-[var(--alert-red)] uppercase tracking-widest flex items-center justify-end gap-1 mb-1">
                              <Clock size={10} /> Deadline
                            </p>
                            <p className="text-xs font-mono font-bold text-white">{new Date(cert.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {activeTab === 'WHISTLEBLOWER' && (
        <div className="max-w-3xl mx-auto animate-in slide-in-from-left-8 duration-500 space-y-6">
          <div className="bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(255,50,50,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--alert-red)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6 border-b border-[var(--alert-red)]/30 pb-6 relative z-10">
              <div className="w-16 h-16 bg-[var(--alert-red)]/20 rounded-2xl flex items-center justify-center border border-[var(--alert-red)]/50 shrink-0">
                <EyeOff size={32} className="text-[var(--alert-red)]" />
              </div>
              <div>
                <h3 className="text-xl font-black font-mono text-[var(--alert-red)] uppercase tracking-widest">Confidential Disclosure</h3>
                <p className="text-sm font-sans text-white/70 mt-1 leading-relaxed">
                  Submissions are cryptographically decoupled from your session. IP addresses are not logged. Reports route directly to the Ethics Committee.
                </p>
              </div>
            </div>
            
            {reportSubmitted ? (
              <div className="py-16 text-center animate-in zoom-in relative z-10">
                <ShieldCheck size={64} className="mx-auto text-[var(--alert-red)] mb-6 opacity-80" />
                <h4 className="text-2xl font-black font-mono text-white tracking-widest uppercase mb-2">Transmission Secure</h4>
                <p className="text-[var(--text-muted)] font-mono text-sm">Your disclosure has been encrypted and successfully routed.</p>
              </div>
            ) : (
              <form 
                className="space-y-6 relative z-10" 
                onSubmit={e => { e.preventDefault(); submitReport.mutate({ report: reportText }); }}
              >
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldAlert size={12} className="text-[var(--alert-red)]" /> Secure Input Area
                  </label>
                  <textarea 
                    required rows={6} 
                    value={reportText} onChange={e => setReportText(e.target.value)}
                    placeholder="Provide detailed, factual information regarding the integrity violation..."
                    className="w-full bg-black/60 border border-[var(--alert-red)]/30 rounded-xl p-5 text-sm text-white focus:border-[var(--alert-red)] focus:ring-1 focus:ring-[var(--alert-red)]/50 outline-none resize-none custom-scrollbar transition-all"
                  />
                </div>
                
                <button 
                  disabled={submitReport.isPending || !reportText.trim()} type="submit" 
                  className="w-full bg-[var(--alert-red)] text-white py-4 rounded-xl font-black font-mono text-xs uppercase tracking-widest hover:bg-red-600 shadow-[0_0_20px_rgba(255,50,50,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <EyeOff size={16} /> Execute Anonymous Transmission
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
