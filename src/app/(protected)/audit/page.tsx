"use client";

import React, { useState } from 'react';
import { Search, Filter, FileDigit, Download, ShieldCheck, AlertTriangle, ShieldAlert, TerminalSquare, Info } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function AuditLogPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin';
  
  const [filter, setFilter] = useState('');
  
  const { data: logs, isLoading } = trpc.audit.getLogs.useQuery(undefined, { enabled: isAdmin });

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white uppercase tracking-widest">Level 5 Clearance Required</h2>
          <p className="text-[var(--text-muted)] text-sm font-mono">Immutable System Ledgers are restricted to SysAdmins.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Querying Immutable Ledger...</div>;
  }

  const logList = logs || [];
  
  // Filter logic
  const filteredLogs = logList.filter((log: any) => 
    log.action.toLowerCase().includes(filter.toLowerCase()) || 
    log.target.toLowerCase().includes(filter.toLowerCase()) ||
    log.user.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <TerminalSquare className="text-orange-500" size={36} />
            System Audit Log
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Immutable ledger of all system actions and mutations.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-6 md:mt-0 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Grep logs..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
            />
          </div>
          <button className="w-full md:w-auto bg-black/50 border border-white/10 text-white px-4 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:border-orange-500 hover:text-orange-400 transition-all flex items-center justify-center gap-2">
            <Download size={14} /> Dump
          </button>
        </div>
      </div>
      
      {/* Ledger Table */}
      <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead className="bg-white/5 border-b border-white/10 text-[9px] text-[var(--text-muted)] uppercase tracking-widest relative z-10">
              <tr>
                <th className="p-4 pl-6 whitespace-nowrap">Timestamp (UTC)</th>
                <th className="p-4 whitespace-nowrap">Severity</th>
                <th className="p-4 whitespace-nowrap">Action Type</th>
                <th className="p-4 whitespace-nowrap">Target Resource</th>
                <th className="p-4 whitespace-nowrap">Actor / IP</th>
                <th className="p-4 pr-6 whitespace-nowrap text-right">Cryptographic Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 relative z-10 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <TerminalSquare size={48} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
                    <p className="text-sm font-bold text-[var(--text-muted)] font-mono uppercase tracking-widest">No matching logs found in ledger.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group/row">
                    <td className="p-4 pl-6 text-white/50 text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${
                        log.severity === 'CRITICAL' ? 'bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]/30' :
                        log.severity === 'WARNING' ? 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30' :
                        'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30'
                      }`}>
                        {log.severity === 'CRITICAL' && <AlertTriangle size={10} />}
                        {log.severity === 'WARNING' && <ShieldAlert size={10} />}
                        {log.severity === 'INFO' && <Info size={10} />}
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-4 text-orange-400 whitespace-nowrap">
                      {log.target}
                    </td>
                    <td className="p-4 text-[var(--text-muted)] whitespace-nowrap text-xs flex items-center gap-2">
                      <ShieldCheck size={14} className="opacity-50" /> {log.user}
                    </td>
                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                      {log.hash ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-mono text-[var(--verify-green)] bg-[var(--verify-green)]/10 px-2 py-0.5 rounded border border-[var(--verify-green)]/30 flex items-center gap-1">
                            <FileDigit size={10} /> SHA-256
                          </span>
                          <span className="text-[10px] text-white/50 font-mono tracking-tighter truncate max-w-[120px]" title={`Current: ${log.hash}\nPrevious: ${log.previousHash || 'GENESIS'}`}>
                            {log.hash.slice(0, 16)}...
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--alert-red)] font-mono bg-[var(--alert-red)]/10 px-2 py-1 rounded border border-[var(--alert-red)]/30">UNVERIFIED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
