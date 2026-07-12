"use client";

import React, { useState, useEffect } from 'react';
import { Network, ArrowRight, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function OrgChartSandboxPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const { data: orgData, isLoading } = trpc.orgchart.getOrgData.useQuery(undefined, { enabled: isAdmin });
  const [localUsers, setLocalUsers] = useState<any[]>([]);

  useEffect(() => {
    if (orgData) setLocalUsers(orgData.users);
  }, [orgData]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Network size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white">Classified Intel</h2>
          <p className="text-[var(--text-muted)] text-sm">Org Restructuring is restricted to Level 4 (HR) Clearance.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-white/50 animate-pulse font-mono">Loading Organizational Topology...</div>;

  const depts = orgData?.departments.map(d => d.name).concat('Unassigned') || [];

  const handleDrop = (userId: string, targetDept: string) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, department: targetDept } : u));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Network className="text-[var(--ledger-blue)]" size={28} /> Restructure Sandbox
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={12} className="text-[var(--signal-amber)]" />
            Simulation Mode Active (Changes are not saved)
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-4">
        {depts.map(dept => {
          const deptUsers = localUsers.filter(u => u.department === dept);
          const totalSalary = deptUsers.reduce((sum, u) => sum + u.salary, 0);

          return (
            <div 
              key={dept}
              className="w-80 shrink-0 bg-white/5 border border-white/10 rounded-2xl flex flex-col transition-colors hover:border-white/20"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e.dataTransfer.getData('userId'), dept)}
            >
              <div className="p-4 border-b border-white/10 bg-black/40 rounded-t-2xl">
                <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-3">{dept}</h3>
                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><Users size={12}/> {deptUsers.length}</span>
                  <span className="flex items-center gap-1 text-[var(--signal-amber)]"><DollarSign size={12}/> {totalSalary.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                {deptUsers.map(u => (
                  <div 
                    key={u.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('userId', u.id)}
                    className="bg-black/60 border border-white/5 p-3 rounded-xl cursor-grab active:cursor-grabbing hover:border-[var(--ledger-blue)]/50 transition-colors"
                  >
                    <p className="font-bold text-sm text-white">{u.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{u.role}</p>
                      <p className="text-[9px] font-mono text-[var(--verify-green)]">${u.salary.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
