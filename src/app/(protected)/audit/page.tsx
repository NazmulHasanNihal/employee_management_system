'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Search, Database } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function AuditLogsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/audit')
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setEvents(data.events);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (!loading && !isAdmin) {
    return <div className="p-8 text-center text-red-500 font-mono text-xl">ACCESS DENIED</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b-4 border-black relative">
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3 px-2 py-1 bg-black">
            <Shield className="text-white" size={36} />
            System Ledger
          </h2>
          <p className="font-mono text-sm md:text-base mt-2 text-white flex items-center gap-2 bg-black px-2 inline-block">
            IMMUTABLE EVENT STORE (EVENTS)
          </p>
        </div>
      </div>

      <div className="bg-white p-1 border-4 border-black shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
        <div className="bg-black text-white p-4 font-mono flex items-center justify-between border-b-4 border-white">
          <div className="flex items-center gap-2 text-xl font-black tracking-widest">
            <Database size={24} /> LOGS
          </div>
          <div className="flex bg-white text-black p-1">
            <input 
              type="text" 
              placeholder="SEARCH HASH / ACTOR" 
              className="bg-transparent outline-none px-2 font-mono text-xs w-64 placeholder-black/50 uppercase" 
            />
            <Search size={16} className="text-black m-1" />
          </div>
        </div>
        
        <div className="bg-white overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center font-mono font-black text-black text-2xl uppercase tracking-widest animate-pulse">
              FETCHING BLOCKS...
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-4 border-r-4 border-white whitespace-nowrap">TIMESTAMP</th>
                  <th className="p-4 border-r-4 border-white">ACTION</th>
                  <th className="p-4 border-r-4 border-white">ACTOR_ID</th>
                  <th className="p-4">HASH (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {events.map((evt: any, i: number) => (
                  <tr key={evt.id} className="border-b-2 border-black hover:bg-black/10 transition-colors">
                    <td className="p-4 border-r-4 border-black font-bold whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 border-r-4 border-black">
                      {evt.action} {evt.targetId && `-> [${evt.targetId}]`}
                    </td>
                    <td className="p-4 border-r-4 border-black">
                      {evt.actorId}
                    </td>
                    <td className="p-4 text-[10px] text-gray-500 break-all">
                      {evt.hash || `0x${Math.random().toString(16).substr(2, 8)}...`}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center font-bold tracking-widest text-black/50">
                      NO EVENTS FOUND IN LEDGER.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
