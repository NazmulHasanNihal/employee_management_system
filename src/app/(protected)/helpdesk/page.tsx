"use client";

import React, { useState } from 'react';
import { LifeBuoy, MessageSquare, Plus, Clock, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function HelpdeskPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Low");

  const { data: tickets, isLoading } = trpc.helpdesk.getTickets.useQuery(undefined, { enabled: !!user?.id });
  const utils = trpc.useUtils();
  
  const createTicket = trpc.helpdesk.createTicket.useMutation({
    onSuccess: () => {
      utils.helpdesk.getTickets.invalidate();
      setSubject("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    createTicket.mutate({ subject, priority });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--alert-red)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--alert-red)] to-orange-400 text-transparent bg-clip-text flex items-center gap-3">
            <LifeBuoy className="text-[var(--alert-red)]" size={32} />
            HR Helpdesk
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Submit inquiries, request assistance, and track ticket status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Ticket Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden">
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Plus size={16} className="text-[var(--alert-red)]" /> New Request
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Payroll discrepancy"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--alert-red)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--alert-red)] transition-colors appearance-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={createTicket.isPending}
                className="w-full bg-[var(--alert-red)] text-white px-4 py-3 rounded-lg font-bold font-mono uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 mt-2"
              >
                {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>

        {/* Tickets List */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm animate-pulse">Loading tickets...</div>
          ) : (
            <div className="space-y-4">
              {tickets?.map(ticket => (
                <div key={ticket.id} className="ledger-panel p-5 border border-white/10 bg-white/5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-[var(--alert-red)]/30 transition-colors group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-white text-lg">{ticket.subject}</h4>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        ticket.priority === 'High' ? 'text-[var(--alert-red)] border-[var(--alert-red)]/30 bg-[var(--alert-red)]/10' :
                        ticket.priority === 'Medium' ? 'text-[var(--signal-amber)] border-[var(--signal-amber)]/30 bg-[var(--signal-amber)]/10' :
                        'text-[var(--text-muted)] border-white/10 bg-white/5'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                        ticket.status === 'Open' ? 'text-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10' :
                        'text-[var(--verify-green)] bg-[var(--verify-green)]/10'
                      }`}>
                        {ticket.status === 'Open' ? <Clock size={10} /> : <CheckCircle size={10} />}
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-4">
                      <span>By: {ticket.user.name}</span>
                      <span>Replies: {ticket.replies.length}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-mono flex items-center gap-2 transition-colors whitespace-nowrap">
                    <MessageSquare size={14} /> View Thread
                  </button>
                </div>
              ))}
              
              {tickets?.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-12 font-mono text-sm border border-dashed border-white/10 rounded-2xl bg-white/5">
                  No active support tickets.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
