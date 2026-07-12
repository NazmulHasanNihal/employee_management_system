"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Activity, Flame } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';
import usePartySocket from '@/lib/usePartySocket';

export default function MessagesPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const utils = trpc.useUtils();

  const { data: conversations, isLoading: convLoading } = trpc.messages.getConversations.useQuery(undefined, { enabled: !!user });
  
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string} | null>(null);
  const [content, setContent] = useState('');
  const [isBurnerMode, setIsBurnerMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading: msgLoading } = trpc.messages.getMessages.useQuery(
    { withUserId: selectedUser?.id || '' },
    { enabled: !!selectedUser }
  );

  const sendMutation = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      setContent('');
      utils.messages.getMessages.invalidate();
      socket.send(JSON.stringify({ type: 'dm_update' }));
    }
  });

  const socket = usePartySocket({
    host: 'localhost:1999',
    room: 'ems-global',
    onMessage(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'dm_update') {
        utils.messages.getMessages.invalidate();
        utils.messages.getConversations.invalidate();
      }
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!user || convLoading) {
    return <div className="p-8 text-center ledger-muted animate-pulse font-mono text-[10px]">Loading communications...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar */}
      <div className="w-1/3 max-w-xs flex flex-col border-r ledger-border pr-4">
        <h2 className="text-xl font-mono font-bold uppercase tracking-tight ledger-text mb-4 border-b ledger-border pb-2">Direct Messages</h2>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {conversations?.map((conv) => (
            <button 
              key={conv.id}
              onClick={() => setSelectedUser({ id: conv.id, name: conv.name })}
              className={`w-full text-left p-3 border ledger-border transition-colors ${selectedUser?.id === conv.id ? 'bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]' : 'bg-[var(--bg-card)] hover:border-[var(--ledger-blue)]/50'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none bg-[var(--bg-void)] border ledger-border flex items-center justify-center font-bold text-xs text-[var(--ledger-blue)]">
                  {conv.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold ledger-text text-sm truncate">{conv.name}</h4>
                  <p className="text-[10px] font-mono ledger-muted uppercase tracking-widest truncate">{conv.role}</p>
                </div>
              </div>
            </button>
          ))}
          {(!conversations || conversations.length === 0) && (
            <p className="text-[10px] font-mono ledger-muted text-center py-4">No active conversations.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col border ledger-border bg-[var(--bg-card)]">
        {selectedUser ? (
          <>
            <div className="p-4 border-b ledger-border bg-[var(--bg-void)] flex items-center gap-3">
              <UserIcon size={16} className="text-[var(--ledger-blue)]" />
              <h3 className="font-bold ledger-text">{selectedUser.name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              {msgLoading && <div className="text-center font-mono text-[10px] ledger-muted">Loading messages...</div>}
              {messages?.map((msg) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-bold ${isMine ? 'text-[var(--text-main)]' : 'text-[var(--ledger-blue)]'}`}>
                        {isMine ? 'You' : msg.sender.name}
                      </span>
                      <span className="text-[9px] font-mono ledger-muted">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className={`p-3 max-w-[80%] border ledger-border text-sm ${msg.isBurner ? 'border-[var(--alert-red)] text-[var(--alert-red)] bg-[var(--alert-red)]/5' : isMine ? 'bg-[var(--text-main)] text-[var(--bg-void)] border-transparent' : 'bg-[var(--bg-void)]'}`}>
                      {msg.isBurner && <div className="text-[8px] uppercase tracking-widest flex items-center gap-1 mb-1 font-bold"><Flame size={8}/> Burner</div>}
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              {messages?.length === 0 && <div className="text-center font-mono text-[10px] ledger-muted mt-10">Say hello to {selectedUser.name}!</div>}
            </div>

            <div className="p-4 border-t ledger-border bg-[var(--bg-void)]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (content.trim() && !sendMutation.isPending) {
                    sendMutation.mutate({ receiverId: selectedUser.id, content, isBurner: isBurnerMode });
                  }
                }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Transmit message..." 
                  className="flex-1 ledger-input px-4 py-3 text-sm font-sans"
                />
                <button 
                  type="button"
                  onClick={() => setIsBurnerMode(!isBurnerMode)}
                  title="Burner Mode (Self-Destruct)"
                  className={`p-2 transition-colors ${isBurnerMode ? 'text-[var(--alert-red)] animate-pulse' : 'text-[var(--ledger-muted)] hover:text-white'}`}
                >
                  <Flame size={16} />
                </button>
                <button 
                  type="submit"
                  disabled={!content.trim() || sendMutation.isPending}
                  className="btn-primary px-6 flex items-center justify-center gap-2"
                >
                  {sendMutation.isPending ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <UserIcon size={48} className="ledger-muted mb-4 opacity-20" />
            <h3 className="font-mono text-sm font-bold ledger-text uppercase tracking-widest">No Channel Selected</h3>
            <p className="text-xs font-sans ledger-muted mt-2 max-w-sm">Select a user from the sidebar to establish a secure comms link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
