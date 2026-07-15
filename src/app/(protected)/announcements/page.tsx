"use client";

import React, { useState } from 'react';
import { 
  Megaphone, AlertTriangle, Info, BellRing, Edit3, Send, Check, 
  Trash2, X, Pin, PinOff, Users, Globe, Phone, Tag,
  Filter, Search, ChevronDown, AlertOctagon, Bell
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

type Priority = 'Low' | 'Medium' | 'High' | 'Emergency';
type Category = 'Universal' | 'Team' | 'Calls' | 'Other';

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string; icon: any; glow?: string }> = {
  Low: { color: 'text-[var(--ledger-blue)]', bg: 'bg-[var(--ledger-blue)]/20', border: 'border-l-[var(--ledger-blue)]', icon: Info },
  Medium: { color: 'text-[var(--signal-amber)]', bg: 'bg-[var(--signal-amber)]/20', border: 'border-l-[var(--signal-amber)]', icon: BellRing },
  High: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-l-red-500', icon: AlertTriangle, glow: 'shadow-[0_0_30px_rgba(255,0,0,0.1)]' },
  Emergency: { color: 'text-red-500', bg: 'bg-red-600/30', border: 'border-l-red-600', icon: AlertOctagon, glow: 'shadow-[0_0_40px_rgba(255,0,0,0.3)]' },
};

const CATEGORY_CONFIG: Record<Category, { icon: any; label: string; color: string }> = {
  Universal: { icon: Globe, label: 'Universal', color: 'text-cyan-400' },
  Team: { icon: Users, label: 'Team', color: 'text-purple-400' },
  Calls: { icon: Phone, label: 'Calls', color: 'text-[var(--signal-amber)]' },
  Other: { icon: Tag, label: 'Other', color: 'text-[var(--text-muted)]' },
};

export default function AnnouncementsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;

  // Composer state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [category, setCategory] = useState<Category>('Universal');
  const [targetTeam, setTargetTeam] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('Medium');

  // Filters
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const { data: announcements, isLoading } = trpc.news.getAll.useQuery(undefined, { enabled: !!user });
  const { data: departments } = trpc.departments.getDepartments.useQuery();

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      setTitle('');
      setContent('');
      setPriority('Medium');
      setCategory('Universal');
      setTargetTeam('');
      setIsPinned(false);
      setIsSubmitting(false);
      window.location.reload();
    }
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      window.location.reload();
    }
  });

  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => window.location.reload()
  });

  // Permission checks
  const isCEO = (user?.designation || '').toLowerCase().includes('ceo');
  const isAdminOrHR = user?.role === 'Admin' || user?.role === 'HR Manager';
  const isManager = user?.role === 'Manager';
  const canPost = isCEO || isAdminOrHR || isManager;

  const handlePost = () => {
    if (!title || !content) return;
    setIsSubmitting(true);
    createMutation.mutate({ title, content, priority, category, targetTeam: category === 'Team' ? targetTeam : null, isPinned });
  };

  const handleEdit = (ann: any) => {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditPriority(ann.priority);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editTitle || !editContent) return;
    updateMutation.mutate({ id: editingId, title: editTitle, content: editContent, priority: editPriority });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this news? This action cannot be undone.')) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter announcements
  const filteredAnnouncements = (announcements || []).filter((ann: any) => {
    if (filterPriority && ann.priority !== filterPriority) return false;
    if (filterCategory && ann.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ann.title.toLowerCase().includes(q) || ann.content.toLowerCase().includes(q);
    }
    return true;
  });

  if (!user || isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] font-mono animate-pulse uppercase tracking-widest">Loading Comms Hub...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-purple-500/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Megaphone className="text-[var(--ledger-blue)]" size={36} />
            Company News
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Company-wide broadcasts, team updates, and critical alerts.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search news..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Priority Filters */}
          <button onClick={() => setFilterPriority(null)} className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all border ${!filterPriority ? 'bg-white text-black border-white' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}>All</button>
          {(['Emergency', 'High', 'Medium', 'Low'] as Priority[]).map(p => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? null : p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all border ${filterPriority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current` : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}>
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Category Filters */}
          {(['Universal', 'Team', 'Calls'] as Category[]).map(c => {
            const CatIcon = CATEGORY_CONFIG[c].icon;
            return (
              <button key={c} onClick={() => setFilterCategory(filterCategory === c ? null : c)} className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all border flex items-center gap-1 ${filterCategory === c ? 'bg-white/10 text-white border-white/30' : 'bg-black/40 text-[var(--text-muted)] border-white/10 hover:border-white/30'}`}>
                <CatIcon size={12} /> {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* News Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Emergency Banner (if any) */}
          {filteredAnnouncements.some((ann: any) => ann.priority === 'Emergency') && (
            <div className="bg-red-600/20 border-2 border-red-600/50 rounded-2xl p-4 animate-pulse flex items-center gap-3">
              <AlertOctagon size={24} className="text-red-500 shrink-0" />
              <div>
                <p className="text-red-400 font-mono font-bold uppercase tracking-widest text-sm">Emergency Alert Active</p>
                <p className="text-red-300/70 text-xs mt-1">There are emergency announcements requiring immediate attention.</p>
              </div>
            </div>
          )}

          {filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
              <Megaphone size={32} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
              <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No News Found</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                {searchQuery || filterPriority || filterCategory ? 'Try adjusting your filters.' : 'No broadcasts have been posted yet.'}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((ann: any) => {
              const pConfig = PRIORITY_CONFIG[ann.priority as Priority] || PRIORITY_CONFIG.Medium;
              const PriorityIcon = pConfig.icon;
              const cConfig = CATEGORY_CONFIG[ann.category as Category] || CATEGORY_CONFIG.Other;
              const CatIcon = cConfig.icon;
              const isEditing = editingId === ann.id;

              return (
                <div key={ann.id} className={`bg-white/5 backdrop-blur-xl border-l-4 rounded-r-2xl rounded-l-sm p-6 relative overflow-hidden transition-all duration-300 hover:bg-white/[0.07] ${pConfig.border} ${pConfig.glow || ''} border-y border-r border-white/5`}>
                  
                  {ann.priority === 'Emergency' && (
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                  )}

                  {ann.isPinned && (
                    <div className="absolute top-3 right-3 z-10">
                      <Pin size={14} className="text-[var(--signal-amber)]" />
                    </div>
                  )}

                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-4 relative z-10">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none font-bold" />
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--ledger-blue)] outline-none resize-none h-24" />
                      <div className="flex gap-2">
                        {(['Low', 'Medium', 'High', 'Emergency'] as Priority[]).map(p => (
                          <button key={p} onClick={() => setEditPriority(p)} className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase border transition-all ${editPriority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current` : 'bg-black/30 text-[var(--text-muted)] border-white/5'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-white/5 text-[var(--text-muted)] rounded-lg text-xs font-mono uppercase hover:bg-white/10 transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-[var(--verify-green)] text-black rounded-lg text-xs font-mono uppercase font-bold hover:brightness-110 transition-all flex items-center gap-1">
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-xl">{ann.title}</h3>
                          {ann.isEdited && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">(edited)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full flex items-center gap-1 font-bold ${pConfig.bg} ${pConfig.color} border border-current/30`}>
                            <PriorityIcon size={12} />
                            {ann.priority}
                          </span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full flex items-center gap-1 bg-white/5 border border-white/10 ${cConfig.color}`}>
                            <CatIcon size={10} />
                            {ann.category}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap relative z-10">
                        {ann.content}
                      </p>

                      {ann.targetTeam && (
                        <div className="mt-3 relative z-10">
                          <span className="text-[9px] font-mono uppercase bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20 flex items-center gap-1 w-max">
                            <Users size={10} /> {ann.targetTeam} Team
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)] uppercase relative z-10">
                        <div className="flex gap-4 items-center">
                          <span className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                            <div className="w-4 h-4 rounded-full bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] flex items-center justify-center font-bold">{ann.author.charAt(0)}</div>
                            {ann.author}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span>{new Date(ann.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          
                          {ann.canEdit && (
                            <button onClick={() => handleEdit(ann)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                              <Edit3 size={12} className="text-[var(--ledger-blue)]" />
                            </button>
                          )}
                          {ann.canDelete && (
                            <button onClick={() => handleDelete(ann.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Composer (Authorized Users Only) */}
        {canPost && (
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sticky top-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 text-white border-b border-white/10 pb-4">
                <Edit3 size={18} className="text-[var(--ledger-blue)]" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Compose News</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none font-sans transition-colors"
                    placeholder="Enter news subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Priority Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Low', 'Medium', 'High', 'Emergency'] as Priority[]).map(p => (
                      <button 
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border ${
                          priority === p 
                            ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current ${p === 'Emergency' ? 'shadow-[0_0_15px_rgba(255,0,0,0.3)]' : ''}`
                            : 'bg-black/50 text-[var(--text-muted)] border-white/5 hover:bg-white/5'
                        }`}
                      >
                        {p === 'Emergency' ? '🚨' : ''} {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Universal', 'Team', 'Calls', 'Other'] as Category[]).map(c => {
                      const CIcon = CATEGORY_CONFIG[c].icon;
                      return (
                        <button 
                          key={c}
                          onClick={() => setCategory(c)}
                          className={`py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors border flex items-center justify-center gap-1 ${
                            category === c 
                              ? 'bg-white/10 text-white border-white/30'
                              : 'bg-black/50 text-[var(--text-muted)] border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <CIcon size={12} /> {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team Selector */}
                {category === 'Team' && (
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Target Team</label>
                    <select
                      value={targetTeam}
                      onChange={e => setTargetTeam(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none appearance-none"
                    >
                      <option value="">Select department...</option>
                      {(departments || []).map((d: any) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pin toggle */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPinned(!isPinned)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all ${
                      isPinned ? 'bg-[var(--signal-amber)]/20 text-[var(--signal-amber)] border-[var(--signal-amber)]/30' : 'bg-black/30 text-[var(--text-muted)] border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
                    {isPinned ? 'Pinned' : 'Pin to Top'}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Message Body</label>
                  <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    className="w-full h-32 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none font-sans resize-none transition-colors custom-scrollbar"
                    placeholder="Type the news content here..."
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
                        : priority === 'Emergency'
                          ? 'bg-red-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                          : 'bg-[var(--ledger-blue)] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,195,255,0.3)]'
                  }`}
                >
                  {isSubmitting ? <Check size={18} className="animate-pulse" /> : <Send size={18} />}
                  {isSubmitting ? 'Publishing...' : 'Publish News'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
