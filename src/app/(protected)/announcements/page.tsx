"use client";

import React, { useState } from 'react';
import { Megaphone, Activity } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import usePartySocket from '@/lib/usePartySocket';

export default function AnnouncementsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const utils = trpc.useUtils();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const { data: announcements, isLoading } = trpc.announcements.getAll.useQuery(undefined, { enabled: !!user });
  
  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      setTitle('');
      setContent('');
      setPriority('Medium');
      utils.announcements.getAll.invalidate();
      socket.send(JSON.stringify({ type: 'announcement_update' }));
      socket.send(JSON.stringify({ type: 'notification_update' })); // Global ping
    }
  });

  const socket = usePartySocket({
    host: 'localhost:1999',
    room: 'ems-global',
    onMessage(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'announcement_update') {
        utils.announcements.getAll.invalidate();
      }
    }
  });

  const canPost = user?.role === 'Admin' || user?.role === 'HR Manager';

  if (!user || isLoading) {
    return <div className="p-8 text-center ledger-muted animate-pulse font-mono text-[10px]">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text">Announcements</h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">Company-Wide Broadcasts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {announcements?.map(ann => (
            <div key={ann.id} className="ledger-panel p-6 border-l-4 border-l-transparent transition-colors group" 
                 style={{ borderLeftColor: ann.priority === 'High' ? 'var(--alert-red)' : ann.priority === 'Medium' ? 'var(--signal-amber)' : 'var(--ledger-blue)' }}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold ledger-text text-lg">{ann.title}</h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-1 border ${
                  ann.priority === 'High' ? 'border-[var(--alert-red)] text-[var(--alert-red)]' : 
                  ann.priority === 'Medium' ? 'border-[var(--signal-amber)] text-[var(--signal-amber)]' : 
                  'border-[var(--ledger-blue)] text-[var(--ledger-blue)]'
                }`}>
                  {ann.priority} Priority
                </span>
              </div>
              <p className="text-sm ledger-muted leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              <div className="mt-4 pt-4 border-t ledger-border flex justify-between items-center text-[10px] font-mono ledger-muted uppercase">
                <span className="flex items-center gap-1"><Megaphone size={12}/> {ann.author}</span>
                <span>{new Date(ann.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {(!announcements || announcements.length === 0) && (
            <div className="p-12 text-center border border-dashed ledger-border">
              <h3 className="font-mono text-sm font-bold ledger-text uppercase tracking-widest">No Broadcasts</h3>
            </div>
          )}
        </div>

        {/* Composer */}
        {canPost && (
          <div className="ledger-panel p-6 h-fit sticky top-6">
            <h3 className="font-mono text-xs font-bold text-[var(--text-main)] uppercase tracking-widest mb-4">Compose Broadcast</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full ledger-input px-3 py-2 text-sm"
                  placeholder="Subject..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">Priority</label>
                <select 
                  value={priority} 
                  onChange={e => setPriority(e.target.value as any)} 
                  className="w-full ledger-input px-3 py-2 text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">Content</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  rows={6}
                  className="w-full ledger-input px-3 py-2 text-sm custom-scrollbar"
                  placeholder="Transmit message..."
                />
              </div>
              <button 
                disabled={createMutation.isPending || !title || !content}
                onClick={() => createMutation.mutate({ title, content, priority })}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? <Activity size={16} className="animate-spin" /> : <Megaphone size={16} />}
                {createMutation.isPending ? 'BROADCASTING...' : 'BROADCAST'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
