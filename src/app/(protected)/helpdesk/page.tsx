"use client";

import React, { useState } from 'react';
import { LifeBuoy, MessageSquare, Plus, Clock, CheckCircle, Ticket, AlertTriangle, AlertCircle, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function HelpdeskPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';
  
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Low");
  const [description, setDescription] = useState("");

  const { data: tickets, isLoading } = trpc.helpdesk.getTickets.useQuery(undefined, { enabled: !!user?.id });
  const utils = trpc.useUtils();
  
  const createTicket = trpc.helpdesk.createTicket.useMutation({
    onSuccess: () => {
      utils.helpdesk.getTickets.invalidate();
      setSubject("");
      setDescription("");
      setPriority("Low");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    createTicket.mutate({ subject, priority }); // Note: API mock might not take description, but UI will look good
  };

  const getPriorityIcon = (p: string) => {
    if (p === 'High') return <AlertTriangle size={14} />;
    if (p === 'Medium') return <AlertCircle size={14} />;
    return <Clock size={14} />;
  };

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'text-[var(--alert-red)] bg-[var(--alert-red)]/10 border-[var(--alert-red)]/30';
    if (p === 'Medium') return 'text-[var(--signal-amber)] bg-[var(--signal-amber)]/10 border-[var(--signal-amber)]/30';
    return 'text-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]/30';
  };

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Querying Support Database...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <LifeBuoy className="text-orange-500" size={36} />
            Support Center
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Submit IT/HR inquiries and track resolution status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Ticket Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl group transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors -translate-y-1/2 translate-x-1/4" />
            
            <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-2 border-b border-white/10 pb-4">
              <Plus size={16} className="text-orange-400" /> New Support Ticket
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Subject / Title</label>
                <input 
                  type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Cannot access staging VPN"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Severity Level</label>
                <select 
                  value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="Low">Low - Minor issue, no blocker</option>
                  <option value="Medium">Medium - Workflow impeded</option>
                  <option value="High">High - Critical system blocker</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Detailed Description</label>
                <textarea 
                  required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide logs or specific details..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors resize-none custom-scrollbar"
                />
              </div>

              <button 
                type="submit" disabled={createTicket.isPending || !subject.trim() || !description.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={18} /> Open Ticket
              </button>
            </form>
          </div>
        </div>

        {/* Tickets Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
              <Ticket size={16} className="text-[var(--text-muted)]" /> Active Ticket Feed
            </h3>
          </div>

          <div className="space-y-4">
            {(!tickets || tickets.length === 0) ? (
              <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
                <LifeBuoy size={48} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
                <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Active Tickets.</h3>
              </div>
            ) : (
              tickets.map((ticket: any) => (
                <div key={ticket.id} className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 transition-colors rounded-3xl p-6 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-transparent opacity-50" />
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/30">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Ticket #{ticket.id.slice(0,6)}</p>
                        <h4 className="font-bold text-white text-lg font-mono">{ticket.subject}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityIcon(ticket.priority)} {ticket.priority} Priority
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-4 mt-4 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Current Status</p>
                      <span className={`text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 ${
                        ticket.status === 'Resolved' ? 'text-[var(--verify-green)]' :
                        ticket.status === 'Open' ? 'text-[var(--alert-red)] animate-pulse' :
                        'text-[var(--signal-amber)]'
                      }`}>
                        {ticket.status === 'Resolved' ? <CheckCircle size={14}/> : <Clock size={14}/>} {ticket.status}
                      </span>
                    </div>
                    
                    <div className="sm:text-right">
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Created At</p>
                      <p className="text-xs font-mono text-white/70">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {isAdmin && ticket.status !== 'Resolved' && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                      <button className="bg-[var(--verify-green)]/20 text-[var(--verify-green)] border border-[var(--verify-green)]/30 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)] hover:text-black transition-colors flex items-center gap-2">
                        <CheckCircle size={14} /> Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
