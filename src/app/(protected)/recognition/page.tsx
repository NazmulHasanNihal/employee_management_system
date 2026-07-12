"use client";

import React, { useState } from 'react';
import { Award, Zap, Heart, Star, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function RecognitionPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");

  const utils = trpc.useUtils();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: "" });
  const { data: kudos, isLoading } = trpc.recognition.getRecentKudos.useQuery();

  const sendKudo = trpc.recognition.sendKudo.useMutation({
    onSuccess: () => {
      utils.recognition.getRecentKudos.invalidate();
      setReceiverId("");
      setMessage("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !message.trim()) return;
    sendKudo.mutate({ receiverId, message });
  };

  const colleagues = users?.filter((u: any) => u.id !== user?.id) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-yellow-400 to-amber-200 text-transparent bg-clip-text flex items-center gap-3">
            <Award className="text-yellow-400" size={32} />
            Kudos Board
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Publicly recognize and celebrate your colleagues' hard work.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Send Kudo Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
            <div className="absolute -right-10 -top-10 text-yellow-500/10 group-hover:rotate-12 transition-transform duration-700">
              <Zap size={150} />
            </div>
            
            <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-2">
              <Star className="text-yellow-400" size={20} /> Give a Shoutout
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">To Colleague</label>
                <select 
                  required value={receiverId} onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none appearance-none"
                >
                  <option value="">Select someone...</option>
                  {colleagues.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.department})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Message</label>
                <textarea 
                  required rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thank you for helping me with..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none resize-none"
                />
              </div>

              <button 
                type="submit" disabled={sendKudo.isPending}
                className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Send size={18} /> Send Kudo
              </button>
            </form>
          </div>
        </div>

        {/* Kudos Feed */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm animate-pulse">Loading kudos...</div>
          ) : (
            <div className="space-y-4">
              {kudos?.map((kudo: any) => (
                <div key={kudo.id} className="ledger-panel p-5 border border-white/10 bg-white/5 rounded-2xl relative group hover:border-yellow-500/30 transition-colors">
                  <div className="absolute top-4 right-4 text-yellow-500/20 group-hover:text-yellow-500/80 transition-colors">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-white text-lg">{kudo.receiver.name}</span>
                    <span className="text-xs text-[var(--text-muted)] font-mono uppercase">received a kudo from</span>
                    <span className="font-mono text-sm text-yellow-400">{kudo.sender.name}</span>
                  </div>
                  
                  <p className="text-white/80 leading-relaxed italic border-l-2 border-yellow-500/50 pl-3">
                    "{kudo.message}"
                  </p>
                  
                  <div className="mt-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    {new Date(kudo.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              
              {kudos?.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-12 font-mono text-sm border border-dashed border-white/10 rounded-2xl bg-white/5">
                  No kudos sent yet. Be the first!
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
