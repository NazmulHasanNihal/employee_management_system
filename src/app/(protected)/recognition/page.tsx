"use client";

import React, { useState } from 'react';
import { Award, Zap, Heart, Star, Send, Trophy, Flame } from 'lucide-react';
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

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Loading Hall of Fame...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Trophy className="text-yellow-400" size={36} />
            Hall of Fame
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Publicly recognize and celebrate your colleagues.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Send Kudo Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl group transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-colors -translate-y-1/2 translate-x-1/4" />
            
            <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-2 border-b border-white/10 pb-4">
              <Zap className="text-yellow-400" size={16} /> Give a Shoutout
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Recipient Colleague</label>
                <select 
                  required value={receiverId} onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-yellow-500 outline-none appearance-none transition-colors"
                >
                  <option value="">Select a champion...</option>
                  {colleagues.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Message of Praise</label>
                <textarea 
                  required rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thank you for being awesome because..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500 outline-none resize-none transition-colors custom-scrollbar"
                />
              </div>

              <button 
                type="submit" disabled={sendKudo.isPending || !receiverId || !message.trim()}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all disabled:opacity-50"
              >
                <Flame size={18} /> Ignite Recognition
              </button>
            </form>
          </div>
        </div>

        {/* Kudos Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
              <Award size={16} className="text-[var(--text-muted)]" /> Recent Accolades
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!kudos || kudos.length === 0) ? (
              <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
                <Heart size={48} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
                <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No shoutouts yet. Be the first!</h3>
              </div>
            ) : (
              kudos.map((kudo: any) => (
                <div key={kudo.id} className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-yellow-500/50 transition-colors rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-yellow-400 to-transparent opacity-50" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">To</p>
                      <p className="font-bold text-white font-mono text-lg">{kudo.receiverName}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30">
                      <Star size={20} className="fill-yellow-400/50" />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5 relative">
                    <Heart size={16} className="absolute top-4 right-4 text-pink-500/30" />
                    <p className="text-sm text-white/90 font-sans italic leading-relaxed pr-8">"{kudo.message}"</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-0.5">From</p>
                      <p className="text-xs font-mono text-[var(--ledger-blue)] font-bold">{kudo.senderName}</p>
                    </div>
                    <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                      {new Date(kudo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
