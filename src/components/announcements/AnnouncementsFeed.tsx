'use client';

import React, { useState } from 'react';
import { Megaphone, AlertTriangle, Info, BellRing, Edit3, Send, Check, Trash2, Pin, PinOff, Users, Globe, Phone, Tag, Filter, Search, AlertOctagon } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';

type Priority = 'Low' | 'Medium' | 'High' | 'Emergency';
type Category = 'Universal' | 'Team' | 'Calls' | 'Other';

const PRIORITY_TONE: Record<Priority, { label: string; tone: string }> = {
  Low: { label: 'text-[var(--brand)] bg-[var(--brand-soft)]', tone: 'brand' },
  Medium: { label: 'text-[var(--amber)] bg-[var(--amber-soft)]', tone: 'amber' },
  High: { label: 'text-[var(--rose)] bg-[var(--rose-soft)]', tone: 'rose' },
  Emergency: { label: 'text-[var(--rose)] bg-[var(--rose-soft)]', tone: 'rose' },
};

const PRIORITY_ICON: Record<Priority, any> = {
  Low: Info, Medium: BellRing, High: AlertTriangle, Emergency: AlertOctagon,
};

const CATEGORY_ICON: Record<Category, any> = {
  Universal: Globe, Team: Users, Calls: Phone, Other: Tag,
};

interface News {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  category: Category;
  targetTeam?: string | null;
  author: string;
  authorName?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

interface Department { id: string; name: string; }

export default function AnnouncementsFeed({ news, departments }: { news: News[]; departments: Department[] }) {
  const { isAdmin, isHR, isCEO, user } = useUser();
  const role = user.role;
  const canPost = isCEO || isAdmin || isHR || role === 'Manager';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [category, setCategory] = useState<Category>('Universal');
  const [targetTeam, setTargetTeam] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('Medium');

  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const utils = trpc.useUtils();
  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => { setTitle(''); setContent(''); setPriority('Medium'); setCategory('Universal'); setTargetTeam(''); setIsPinned(false); setIsSubmitting(false); utils.invalidate('news'); },
  });
  const updateMutation = trpc.news.update.useMutation({ onSuccess: () => { setEditingId(null); utils.invalidate('news'); } });
  const deleteMutation = trpc.news.delete.useMutation({ onSuccess: () => utils.invalidate('news') });

  const handlePost = () => {
    if (!title || !content) return;
    setIsSubmitting(true);
    createMutation.mutate({ title, content, priority, category, targetTeam: category === 'Team' ? targetTeam : null, isPinned });
  };

  const handleEdit = (ann: News) => {
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

  const filtered = news.filter((ann) => {
    if (filterPriority && ann.priority !== filterPriority) return false;
    if (filterCategory && ann.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ann.title.toLowerCase().includes(q) || ann.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-[400px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news..." className="ledger-input w-full rounded-xl py-2.5 pl-9 pr-4 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterPriority(null)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase ${!filterPriority ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>All</button>
          {(['Emergency', 'High', 'Medium', 'Low'] as Priority[]).map((p) => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? null : p)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase ${filterPriority === p ? `${PRIORITY_TONE[p].label} border-current` : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{p}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['Universal', 'Team', 'Calls'] as Category[]).map((c) => (
            <button key={c} onClick={() => setFilterCategory(filterCategory === c ? null : c)} className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase ${filterCategory === c ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>
              {React.createElement(CATEGORY_ICON[c], { size: 12 })} {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Feed */}
        <div className="space-y-4 lg:col-span-2">
          {filtered.some((ann) => ann.priority === 'Emergency') && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[var(--rose)]/50 bg-[var(--rose-soft)] p-4">
              <AlertOctagon className="h-6 w-6 shrink-0 text-[var(--rose)]" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-[var(--rose)]">Emergency Alert Active</p>
                <p className="text-xs text-[var(--text-muted)]">There are emergency announcements requiring immediate attention.</p>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState title="No news found" description={searchQuery || filterPriority || filterCategory ? 'Try adjusting your filters.' : 'No broadcasts have been posted yet.'} icon={<Megaphone className="h-6 w-6" />} />
          ) : (
            filtered.map((ann) => {
              const pConfig = PRIORITY_TONE[ann.priority] || PRIORITY_TONE.Medium;
              const PriorityIcon = PRIORITY_ICON[ann.priority] || Info;
              const CatIcon = CATEGORY_ICON[ann.category] || Tag;
              const isEditing = editingId === ann.id;
              return (
                <div key={ann.id} className={`relative overflow-hidden rounded-2xl border-l-4 bg-[var(--bg-panel)] p-6 shadow-sm ${pConfig.tone.includes('rose') ? 'border-l-[var(--rose)]' : pConfig.tone.includes('amber') ? 'border-l-[var(--amber)]' : 'border-l-[var(--brand)]'}`}>
                  {ann.isPinned && <div className="absolute right-3 top-3"><Pin className="h-3.5 w-3.5 text-[var(--amber)]" /></div>}
                  {isEditing ? (
                    <div className="space-y-3">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm font-semibold" />
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" rows={3} />
                      <div className="flex gap-2">
                        {(['Low', 'Medium', 'High', 'Emergency'] as Priority[]).map((p) => (
                          <button key={p} onClick={() => setEditPriority(p)} className={`rounded-lg border px-3 py-1 text-[10px] font-semibold uppercase ${editPriority === p ? `${PRIORITY_TONE[p].label} border-current` : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{p}</button>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleSaveEdit}><Check className="h-3.5 w-3.5" /> Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex items-start justify-between">
                        <h3 className="text-xl font-semibold text-[var(--text-main)]">{ann.title}{ann.isEdited && <span className="ml-1 text-[8px] uppercase text-[var(--text-muted)]">(edited)</span>}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${pConfig.label}`}><PriorityIcon size={12} /> {ann.priority}</span>
                          <span className="flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2 py-1 text-[10px] font-semibold uppercase text-[var(--text-muted)]"><CatIcon size={10} /> {ann.category}</span>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-[var(--text-muted)]">{ann.content}</p>
                      {ann.targetTeam && (
                        <div className="mt-3">
                          <span className="flex w-max items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[9px] font-semibold uppercase text-[var(--brand-strong)]"><Users size={10} /> {ann.targetTeam} Team</span>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--border-hairline)] pt-3 text-[10px] uppercase text-[var(--text-muted)]">
                        <span className="flex items-center gap-2 rounded-full bg-[var(--bg-hover)] px-3 py-1">{ann.author}</span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(ann.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          {ann.canEdit && <button onClick={() => handleEdit(ann)} className="p-1.5 text-[var(--brand)] hover:bg-[var(--brand-soft)] rounded-lg"><Edit3 size={12} /></button>}
                          {ann.canDelete && <button onClick={() => handleDelete(ann.id)} className="p-1.5 text-[var(--rose)] hover:bg-[var(--rose-soft)] rounded-lg"><Trash2 size={12} /></button>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        {canPost && (
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 border-b border-[var(--border-hairline)] pb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">
                <Edit3 className="h-4 w-4 text-[var(--brand)]" /> Compose News
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Subject</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Enter news subject..." />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Priority Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Low', 'Medium', 'High', 'Emergency'] as Priority[]).map((p) => (
                      <button key={p} onClick={() => setPriority(p)} className={`rounded-xl py-2 text-[10px] font-semibold uppercase ${priority === p ? `${PRIORITY_TONE[p].label} border border-current` : 'border border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>{p === 'Emergency' ? '🚨' : ''} {p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Universal', 'Team', 'Calls', 'Other'] as Category[]).map((c) => (
                      <button key={c} onClick={() => setCategory(c)} className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold uppercase ${category === c ? 'border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>
                        {React.createElement(CATEGORY_ICON[c], { size: 12 })} {c}
                      </button>
                    ))}
                  </div>
                </div>
                {category === 'Team' && (
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Target Team</label>
                    <select value={targetTeam} onChange={(e) => setTargetTeam(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                      <option value="">Select department...</option>
                      {departments.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPinned(!isPinned)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase ${isPinned ? 'border-[var(--amber)]/30 bg-[var(--amber-soft)] text-[var(--amber)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}>
                    {isPinned ? <Pin size={12} /> : <PinOff size={12} />}{isPinned ? 'Pinned' : 'Pin to Top'}
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Message Body</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} className="ledger-input h-32 w-full resize-none rounded-xl px-3 py-2.5 text-sm" placeholder="Type the news content here..." />
                </div>
                <Button variant="primary" size="md" className="w-full" onClick={handlePost} disabled={!title || !content || isSubmitting}>
                  {isSubmitting ? <Check className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}{isSubmitting ? 'Publishing...' : 'Publish News'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
