"use client";

import React, { useState } from 'react';
import { 
  User as UserIcon, CalendarDays, HardDrive, 
  MapPin, Clock, PhoneCall, Mail, MessageSquare, 
  ShieldCheck, Banknote, Briefcase, FileText, ChevronRight, Hash, Building2, Terminal, Shield
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any; 

  const { data: documents, isLoading } = trpc.profile.getDocuments.useQuery(undefined, { enabled: !!user });

  // Role Simulator Toggle (For Testing Only)
  const [viewRole, setViewRole] = useState<'Admin' | 'Employee'>('Admin');

  if (!user || isLoading) {
    return <div className="text-center p-8 text-white font-mono animate-pulse">Loading Profile Data...</div>;
  }

  // Mock extended user data for real-world HR profile
  const extendedUser = {
    ...user,
    empId: "EMP-49201",
    hireDate: "Oct 15, 2021",
    location: "San Francisco, CA (Remote)",
    employmentType: "Full-Time",
    salary: 140000,
    nextReview: "Nov 01, 2026",
    leave: { annual: 14, totalAnnual: 20, sick: 3, totalSick: 10 },
    assets: [
      { id: "A-1029", name: 'MacBook Pro 16" (M3)', status: 'Assigned' },
      { id: "A-5592", name: 'YubiKey 5C NFC', status: 'Assigned' }
    ],
    skills: ["React", "TypeScript", "Node.js", "System Architecture", "GraphQL"]
  };

  const isAdmin = viewRole === 'Admin';
  const userDocs = (documents ?? []).filter(d => d.user === user.name || isAdmin);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Role Simulator Toggle (For Testing Only) */}
      <div className="flex items-center justify-end gap-2 p-2 bg-black/40 rounded-xl border border-white/5 w-max ml-auto">
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mr-2">Simulate Role:</span>
        <button 
          onClick={() => setViewRole('Admin')}
          className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewRole === 'Admin' ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-white hover:bg-white/10'}`}
        >
          Admin
        </button>
        <button 
          onClick={() => setViewRole('Employee')}
          className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewRole === 'Employee' ? 'bg-[var(--signal-amber)] text-black font-bold' : 'text-white hover:bg-white/10'}`}
        >
          Employee
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <UserIcon className="text-[var(--ledger-blue)]" size={36} />
            Employee Vault
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Centralized Identity, HR Records, and Asset Management.
          </p>
        </div>
      </div>

      {/* BENTO BOX GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- IDENTITY HUB (Spans 1 Col, 2 Rows) --- */}
        <div className="md:col-span-1 md:row-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500 hover:border-white/20 group flex flex-col">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--ledger-blue)]/20 to-transparent"></div>
          
          <div className="p-8 flex flex-col items-center text-center relative z-10 flex-1">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-[var(--bg-void)] border-4 border-[var(--ledger-blue)]/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,195,255,0.15)] group-hover:border-[var(--ledger-blue)]/60 transition-colors">
              <span className="text-4xl font-bold font-mono text-[var(--ledger-blue)]">{extendedUser.name.charAt(0)}</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white tracking-tight">{extendedUser.name}</h3>
            <p className="text-sm font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1 mb-4">{extendedUser.designation}</p>
            
            <div className="w-full space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} /> Emp ID
                </span>
                <span className="text-xs font-mono font-bold text-white">{extendedUser.empId}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={12} /> Department
                </span>
                <span className="text-xs font-mono font-bold text-white">{extendedUser.department}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Location
                </span>
                <span className="text-[10px] font-mono font-bold text-white truncate max-w-[120px]">{extendedUser.location}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-[var(--ledger-blue)]/20 text-[var(--text-muted)] hover:text-[var(--ledger-blue)] transition-colors group/btn">
              <Mail size={16} className="group-hover/btn:scale-110 transition-transform" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Email</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-[var(--ledger-blue)]/20 text-[var(--text-muted)] hover:text-[var(--ledger-blue)] transition-colors group/btn">
              <MessageSquare size={16} className="group-hover/btn:scale-110 transition-transform" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Slack</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-[var(--ledger-blue)]/20 text-[var(--text-muted)] hover:text-[var(--ledger-blue)] transition-colors group/btn">
              <PhoneCall size={16} className="group-hover/btn:scale-110 transition-transform" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Call</span>
            </button>
          </div>
        </div>

        {/* --- HR MODULES (Span 2 Cols) --- */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Row 1: Leave & Compensation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Leave Balances */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--verify-green)]/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={16} className="text-[var(--verify-green)]"/> Time Off
                </h4>
                <button className="text-[9px] bg-[var(--verify-green)]/20 text-[var(--verify-green)] px-3 py-1 rounded-full uppercase tracking-widest font-bold hover:bg-[var(--verify-green)] hover:text-black transition-colors">
                  Request
                </button>
              </div>
              
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">Annual Vacation</span>
                    <span className="text-white font-bold">{extendedUser.leave.annual} / {extendedUser.leave.totalAnnual} Days</span>
                  </div>
                  <div className="w-full bg-black/50 border border-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--verify-green)] h-full transition-all" style={{width: `${(extendedUser.leave.annual/extendedUser.leave.totalAnnual)*100}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">Sick Leave</span>
                    <span className="text-white font-bold">{extendedUser.leave.sick} / {extendedUser.leave.totalSick} Days</span>
                  </div>
                  <div className="w-full bg-black/50 border border-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--signal-amber)] h-full transition-all" style={{width: `${(extendedUser.leave.sick/extendedUser.leave.totalSick)*100}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compensation & Review (Protected View) */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Banknote size={16} className="text-purple-400"/> Compensation
                </h4>
                {isAdmin ? (
                  <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 uppercase tracking-widest font-bold flex items-center gap-1">
                    <ShieldCheck size={10} /> Admin View
                  </span>
                ) : (
                  <span className="text-[9px] bg-white/10 text-[var(--text-muted)] px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Shield size={10} /> Private
                  </span>
                )}
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Base Salary</p>
                    {isAdmin ? (
                      <p className="text-xl font-bold text-white font-mono">${extendedUser.salary.toLocaleString()}</p>
                    ) : (
                      <p className="text-xl font-bold text-[var(--text-muted)] font-mono">••••••••</p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Briefcase size={16} />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Next Review</p>
                    <p className="text-sm font-bold text-white font-mono">{extendedUser.nextReview}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[var(--ledger-blue)]/10 flex items-center justify-center text-[var(--ledger-blue)]">
                    <Clock size={16} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Skills & Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Skills & Endorsements */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Terminal size={16} className="text-cyan-400"/> Core Competencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {extendedUser.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-cyan-50 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-default transition-colors">
                    {skill}
                  </span>
                ))}
                {isAdmin && (
                  <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-dashed border-white/20 text-xs font-mono text-[var(--text-muted)] hover:text-white hover:border-white/50 transition-colors">
                    + Add Skill
                  </button>
                )}
              </div>
            </div>

            {/* Assigned Assets */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <HardDrive size={16} className="text-orange-400"/> Assigned Assets
              </h4>
              <div className="space-y-3">
                {extendedUser.assets.map((asset: any) => (
                  <div key={asset.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <HardDrive size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{asset.name}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mt-0.5">ID: {asset.id}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--verify-green)] bg-[var(--verify-green)]/10 px-2 py-1 rounded">
                      {asset.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 3: Document Vault */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-[var(--text-muted)]"/> Secure Document Vault
              </h4>
              <button className="text-[10px] font-mono text-[var(--ledger-blue)] uppercase tracking-widest hover:underline flex items-center">
                View All <ChevronRight size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userDocs.length > 0 ? userDocs.map((doc: any, i: number) => (
                <button key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-[var(--ledger-blue)]/50 hover:bg-[var(--ledger-blue)]/5 transition-all text-left flex items-start gap-3">
                  <FileText size={18} className="text-[var(--ledger-blue)] mt-1" />
                  <div>
                    <p className="text-xs font-bold text-white mb-1">{doc.title}</p>
                    <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase">{doc.type} • {new Date(doc.date).toLocaleDateString()}</p>
                  </div>
                </button>
              )) : (
                <div className="col-span-3 text-center p-8 border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">No documents available in vault</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
