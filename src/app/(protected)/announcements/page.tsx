"use client";

import React, { useState } from 'react';
import { Megaphone, AlertTriangle, Info, BellRing, Edit3, Send, Check } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

export default function AnnouncementsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const utils = trpc.useUtils();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  
  // Role Simulator Toggle (For Testing Only)
  const [viewRole, setViewRole] = useState<'Admin' | 'Employee'>('Admin');

  const { data: announcements, isLoading } = trpc.announcements.getAll.useQuery(undefined, { enabled: !!user });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      setTitle('');
      setContent('');
      setPriority('Medium');
      setIsSubmitting(false);
      utils.announcements.getAll.invalidate();
    }
  });

  const handlePost = () => {
    if (!title || !content) return;
    setIsSubmitting(true);
    createMutation.mutate({ title, content, priority });
  };

  const markReadMutation = trpc.announcements.markRead.useMutation();
  const [readMemos, setReadMemos] = useState<Set<string>>(new Set());

  const handleMarkRead = (id: string) => {
    setReadMemos(prev => new Set(prev).add(id));
    markReadMutation.mutate({ id });
  };

  const isAdmin = viewRole === 'Admin';

  if (!user || isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] font-mono animate-pulse uppercase tracking-widest">Loading Comms Hub...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Role Simulator Toggle */}
      <div className="flex items-center justify-end gap-2 p-2 bg-black/40 rounded-xl border border-white/5 w-max ml-auto">
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mr-2">Simulate Role:</span>
        <button 
          onClick={() => setViewRole('Admin')}
          className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewRole === 'Admin' ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-white hover:bg-white/10'}`}
        >
          Admin
        </button>
        <button 
          onClick={() => setViewRole('Employee')}
          className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewRole === 'Employee' ? 'bg-[var(--signal-amber)] text-black font-bold' : 'text-white hover:bg-white/10'}`}
        >
          Employee
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-purple-500/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Megaphone className="text-[var(--ledger-blue)]" size={36} />
            Comms Hub
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Company-wide broadcasts and critical alerts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {announcements?.map((ann: any) => (
            <div key={ann.id} className={`bg-white/5 backdrop-blur-xl border-l-4 rounded-r-2xl rounded-l-sm p-6 relative overflow-hidden transition-all duration-300 ${
              ann.priority === 'High' 
                ? 'border-l-red-500 shadow-[0_0_30px_rgba(255,0,0,0.1)] hover:shadow-[0_0_40px_rgba(255,0,0,0.2)]' 
                : ann.priority === 'Medium'
                  ? 'border-l-[var(--signal-amber)] hover:bg-white/10 border-y border-r border-white/5'
                  : 'border-l-[var(--ledger-blue)] hover:bg-white/10 border-y border-r border-white/5'
            }`}>
              
              {ann.priority === 'High' && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
              )}

              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="font-bold text-white text-xl">{ann.title}</h3>
                
                <span className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full flex items-center gap-1 font-bold ${
                  ann.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
                  ann.priority === 'Medium' ? 'bg-[var(--signal-amber)]/20 text-[var(--signal-amber)] border border-[var(--signal-amber)]/50' : 
                  'bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] border border-[var(--ledger-blue)]/50'
                }`}>
                  {ann.priority === 'High' ? <AlertTriangle size={12}/> : ann.priority === 'Medium' ? <BellRing size={12}/> : <Info size={12}/>}
                  {ann.priority}
                </span>
              </div>
              
              <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap relative z-10">
                {ann.content}
              </p>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)] uppercase relative z-10">
                <div className="flex gap-4 items-center">
                  <span className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <div className="w-4 h-4 rounded-full bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] flex items-center justify-center font-bold">{ann.author.charAt(0)}</div>
                    {ann.author}
                  </span>
                  {!isAdmin && !readMemos.has(ann.id) && (
                    <button 
                      onClick={() => handleMarkRead(ann.id)}
                      className="flex items-center gap-1 text-[var(--ledger-blue)] hover:text-white transition-colors"
                    >
                      <Check size={12} /> Mark as Read
                    </button>
                  )}
                  {!isAdmin && readMemos.has(ann.id) && (
                    <span className="flex items-center gap-1 text-[var(--verify-green)]">
                      <Check size={12} /> Read
                    </span>
                  )}
                </div>
                <span>{new Date(ann.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
          ))}
          
          {(!announcements || announcements.length === 0) && (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
              <Megaphone size={32} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
              <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Broadcasts</h3>
            </div>
          )}
        </div>

        {/* Composer (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sticky top-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 text-white border-b border-white/10 pb-4">
                <Edit3 size={18} className="text-[var(--ledger-blue)]" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Composer</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none font-sans transition-colors"
                    placeholder="Enter broadcast subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPriority('Low')}
                      className={`py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors border ${priority === 'Low' ? 'bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/50' : 'bg-black/50 text-[var(--text-muted)] border-white/5 hover:bg-white/5'}`}
                    >
                      Low
                    </button>
                    <button 
                      onClick={() => setPriority('Medium')}
                      className={`py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors border ${priority === 'Medium' ? 'bg-[var(--signal-amber)]/20 text-[var(--signal-amber)] border-[var(--signal-amber)]/50' : 'bg-black/50 text-[var(--text-muted)] border-white/5 hover:bg-white/5'}`}
                    >
                      Medium
                    </button>
                    <button 
                      onClick={() => setPriority('High')}
                      className={`py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors border ${priority === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(255,0,0,0.2)]' : 'bg-black/50 text-[var(--text-muted)] border-white/5 hover:bg-white/5'}`}
                    >
                      High
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Message Body</label>
                  <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    className="w-full h-32 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none font-sans resize-none transition-colors custom-scrollbar"
                    placeholder="Type the broadcast message here..."
                  />
                </div>
                
                <button 
                  onClick={handlePost}
                  disabled={!title || !content || isSubmitting}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-widest font-bold transition-all duration-300 ${
                    !title || !content 
                      ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed' 
                      : isSubmitting 
                        ? 'bg-[var(--ledger-blue)]/50 text-black'
                        : 'bg-[var(--ledger-blue)] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,195,255,0.3)]'
                  }`}
                >
                  {isSubmitting ? <Check size={18} className="animate-pulse" /> : <Send size={18} />}
                  {isSubmitting ? 'Transmitting...' : 'Transmit Broadcast'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
