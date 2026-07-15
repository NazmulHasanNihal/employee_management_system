"use client";

import React, { useState } from 'react';
import { ShieldCheck, FileDigit, Search, Lock } from 'lucide-react';
import { EmptyState } from '../EmptyState';

interface AuditClientPageProps {
  initialEvents: any[];
}

export default function AuditClientPage({ initialEvents }: AuditClientPageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const events = initialEvents || [];
  const filteredEvents = events.filter((event: any) => 
    event.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (event.actorName && event.actorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    event.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b-4 border-black relative">
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3 px-2 py-1 bg-black">
            <Lock className="text-white" size={36} />
            Immutable Audit Trail
          </h2>
          <p className="font-mono text-sm md:text-base mt-2 text-white flex items-center gap-2 bg-black px-2 inline-block">
            <ShieldCheck size={16} className="text-[var(--verify-green)]" />
            Cryptographically secured event-sourced ledger.
          </p>
        </div>
      </div>

      <div className="bg-white p-1 border-4 border-black shadow-[8px_8px_0_0_rgba(255,255,255,1)] flex flex-col h-[700px]">
        <div className="bg-black text-white p-4 font-mono flex items-center justify-between border-b-4 border-white">
          <h4 className="font-mono text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <FileDigit size={24} /> System Events
          </h4>
          
          <div className="flex bg-white text-black p-1">
            <input 
              type="text" 
              placeholder="SEARCH HASH / ACTOR"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none px-2 font-mono text-xs w-64 placeholder-black/50 uppercase"
            />
            <Search size={16} className="text-black m-1" />
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto bg-white custom-scrollbar">
          {filteredEvents.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                title="No Events Found" 
                description="No system records match your query." 
              />
            </div>
          ) : (
            <table className="w-full min-w-max text-left font-mono">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 border-r-4 border-white whitespace-nowrap">TIMESTAMP</th>
                  <th className="p-4 border-r-4 border-white">EVENT ID / HASH</th>
                  <th className="p-4 border-r-4 border-white">ACTOR</th>
                  <th className="p-4 border-r-4 border-white">ACTION</th>
                  <th className="p-4">DETAILS</th>
                </tr>
              </thead>
              <tbody className="text-black divide-y-2 divide-black">
                {filteredEvents.map((event: any) => (
                  <tr key={event.id} className="hover:bg-black/10 transition-colors group">
                    <td className="p-4 font-bold border-r-4 border-black whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs opacity-70 group-hover:opacity-100 transition-opacity border-r-4 border-black">
                      {event.hash || event.id}
                    </td>
                    <td className="p-4 border-r-4 border-black">
                      <div className="flex flex-col">
                        <span className="font-bold">{event.actorName || event.actorId}</span>
                        <span className="text-[9px] uppercase tracking-widest text-black/60">{event.actorRole}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r-4 border-black">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-black text-white">
                        {event.action}
                      </span>
                    </td>
                    <td className="p-4 text-xs max-w-xs truncate">
                      {event.details ? JSON.stringify(event.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
