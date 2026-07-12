"use client";

import React, { useState } from 'react';
import { MessageCircle, ShieldQuestion, Send, CheckCircle } from 'lucide-react';
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-pink-500 to-rose-300 text-transparent bg-clip-text flex items-center gap-3">
            <MessageCircle className="text-pink-500" size={32} />
            Feedback Box
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Secure, anonymous channel for suggestions and concerns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Submission Form */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-pink-500/30 transition-colors">
          <div className="absolute -right-10 -top-10 text-pink-500/10 group-hover:rotate-12 transition-transform duration-700">
            <ShieldQuestion size={150} />
          </div>
          
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
            <Send className="text-pink-400" size={24} /> Submit Feedback
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Category</label>
              <select 
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-pink-500 focus:outline-none appearance-none"
              >
                <option value="Suggestion">Suggestion</option>
                <option value="Concern">Concern</option>
                <option value="Culture">Company Culture</option>
                <option value="Facilities">Facilities/Office</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Message</label>
              <textarea 
                required rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts safely and securely..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-pink-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="checkbox" id="anon" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-pink-500 focus:ring-pink-500 bg-black/50"
              />
              <label htmlFor="anon" className="text-sm text-white/80 select-none">Submit Anonymously</label>
            </div>

            <button 
              type="submit" disabled={submitFeedback.isPending || submitted}
              className={`w-full py-3 rounded-lg font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                submitted ? 'bg-[var(--verify-green)] text-black' : 'bg-pink-500 text-white hover:brightness-110'
              }`}
            >
              {submitted ? <><CheckCircle size={18} /> Received</> : <><Send size={18} /> Submit securely</>}
            </button>
          </form>
        </div>

        {/* HR View */}
        {isAdmin && (
          <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl flex flex-col h-full">
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 flex items-center gap-3">
              <ShieldQuestion className="text-pink-400" size={24} /> HR Inbox
            </h3>

            {isLoading ? (
              <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm animate-pulse">Loading feedback...</div>
            ) : (
              <div className="space-y-4 overflow-y-auto flex-1 pr-2" style={{ maxHeight: '400px' }}>
                {allFeedback?.map((fb: any) => (
                  <div key={fb.id} className="p-4 bg-black/40 rounded-xl border border-white/10 hover:border-pink-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono uppercase text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                        {fb.category}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 my-3 leading-relaxed">
                      "{fb.message}"
                    </p>
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        From: <strong className="text-white">{fb.user?.name || "Anonymous"}</strong>
                      </span>
                      <select 
                        value={fb.status}
                        onChange={(e) => updateStatus.mutate({ id: fb.id, status: e.target.value })}
                        className={`text-xs font-mono rounded px-2 py-1 appearance-none border ${
                          fb.status === 'New' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                          fb.status === 'Reviewed' ? 'bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/30' :
                          'bg-[var(--verify-green)]/20 text-[var(--verify-green)] border-[var(--verify-green)]/30'
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Actioned">Actioned</option>
                      </select>
                    </div>
                  </div>
                ))}
                {allFeedback?.length === 0 && (
                  <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                    Inbox is empty.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
