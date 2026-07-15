"use client";

import React, { useState } from 'react';
import { MessageCircle, ShieldQuestion, Send, CheckCircle, Lock, EyeOff, ShieldCheck, Inbox } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function FeedbackPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const [category, setCategory] = useState("Suggestion");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();
  const submitFeedback = trpc.feedback.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      setTimeout(() => setSubmitted(false), 3000);
      if (isAdmin) utils.feedback.getAllFeedback.invalidate();
    }
  });

  const { data: allFeedback, isLoading } = trpc.feedback.getAllFeedback.useQuery(undefined, {
    enabled: isAdmin
  });

  const updateStatus = trpc.feedback.updateFeedbackStatus.useMutation({
    onSuccess: () => utils.feedback.getAllFeedback.invalidate()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitFeedback.mutate({ category, message, isAnonymous });
  };

  if (isLoading && isAdmin) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Decrypting Feedback Vault...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Lock className="text-pink-500" size={36} />
            Secure Drop
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Encrypted, anonymous channel for suggestions and concerns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Submission Form */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl group transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-colors -translate-y-1/2 translate-x-1/4" />
            
            <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-2 border-b border-white/10 pb-4">
              <ShieldQuestion className="text-pink-400" size={16} /> Submit Feedback
            </h3>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in relative z-10">
                <CheckCircle className="text-[var(--verify-green)] mb-4" size={48} />
                <h4 className="font-mono font-bold text-white text-lg">Securely Transmitted</h4>
                <p className="text-[var(--text-muted)] text-sm mt-2 text-center">Your feedback has been encrypted and delivered.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Classification</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-pink-500 outline-none appearance-none transition-colors"
                  >
                    <option value="Suggestion">Suggestion / Idea</option>
                    <option value="Concern">Concern / Issue</option>
                    <option value="Culture">Company Culture</option>
                    <option value="Facilities">Facilities / Office</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Message Payload</label>
                  <textarea 
                    required rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your thoughts safely and securely..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500 outline-none resize-none transition-colors custom-scrollbar"
                  />
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" id="anon" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 text-pink-500 focus:ring-pink-500 bg-black/50 accent-pink-500"
                    />
                    <label htmlFor="anon" className="text-xs font-mono font-bold text-white uppercase tracking-widest select-none cursor-pointer">
                      Ghost Mode (Anonymous)
                    </label>
                  </div>
                  {isAnonymous ? <EyeOff size={16} className="text-pink-500" /> : <EyeOff size={16} className="text-white/20" />}
                </div>

                <button 
                  type="submit" disabled={submitFeedback.isPending || !message.trim()}
                  className="w-full bg-pink-500 text-white py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all disabled:opacity-50"
                >
                  <Send size={18} /> Transmit Payload
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info or Admin View */}
        <div className="space-y-6">
          {!isAdmin ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center relative overflow-hidden">
              <ShieldCheck size={64} className="text-pink-500/30 mb-6" />
              <h3 className="font-mono font-black text-xl text-white uppercase tracking-widest mb-4">Zero-Knowledge Policy</h3>
              <p className="text-[var(--text-muted)] text-sm font-sans leading-relaxed max-w-sm">
                When "Ghost Mode" is enabled, your identity is cryptographically decoupled from your submission. HR and management receive the contents of your message without any identifiable metadata.
              </p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
              <div className="bg-black/40 border-b border-white/10 p-6 flex justify-between items-center">
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
                  <Inbox size={16} className="text-pink-400" /> Administrative Inbox
                </h3>
                <span className="text-[10px] font-mono text-[var(--text-muted)] bg-white/10 px-2 py-1 rounded-full">{allFeedback?.length || 0} Messages</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 max-h-[600px]">
                {(!allFeedback || allFeedback.length === 0) ? (
                  <div className="text-center text-[var(--text-muted)] py-12 font-mono text-[10px] uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-white/10">
                    Inbox is completely empty.
                  </div>
                ) : (
                  allFeedback.map((fb: any) => (
                    <div key={fb.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-white bg-pink-500/20 border border-pink-500/30 px-2 py-1 rounded-md uppercase tracking-widest">
                            {fb.category}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
                            fb.status === 'NEW' ? 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30' :
                            'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30'
                          }`}>
                            {fb.status}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-white font-sans leading-relaxed my-4">"{fb.message}"</p>
                      
                      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                        <div className="flex items-center gap-2">
                          {fb.isAnonymous ? (
                            <><EyeOff size={14} className="text-pink-500" /><span className="text-[10px] font-mono text-pink-500 uppercase tracking-widest font-bold">Anonymous Source</span></>
                          ) : (
                            <><MessageCircle size={14} className="text-[var(--ledger-blue)]" /><span className="text-[10px] font-mono text-[var(--ledger-blue)] uppercase tracking-widest font-bold">From: {fb.user?.name}</span></>
                          )}
                        </div>
                        
                        {fb.status === 'NEW' && (
                          <button 
                            onClick={() => updateStatus.mutate({ id: fb.id, status: 'REVIEWED' })}
                            className="bg-[var(--verify-green)]/20 text-[var(--verify-green)] border border-[var(--verify-green)]/30 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)] hover:text-black transition-colors"
                          >
                            Mark Reviewed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
