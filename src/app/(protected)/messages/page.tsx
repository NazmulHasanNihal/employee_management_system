"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, Flame, Paperclip, Smile, MoreVertical, 
  Phone, Video, Info, Check, CheckCheck
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

export default function MessagesPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { data: conversations, isLoading: convLoading } = trpc.messages.getConversations.useQuery(undefined, { enabled: !!user });
  
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, role: string, online: boolean} | null>(null);
  const [content, setContent] = useState('');
  const [isBurnerMode, setIsBurnerMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Automatically select the first conversation when loaded
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedUser) {
      setSelectedUser(conversations[0]);
    }
  }, [conversations, selectedUser]);

  const { data: messages, isLoading: msgLoading } = trpc.messages.getMessages.useQuery(
    { withUserId: selectedUser?.id || '' },
    { enabled: !!selectedUser }
  );

  // Fake mutation to make the chat feel responsive
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  useEffect(() => {
    // Reset optimistic messages when switching chats
    setOptimisticMessages([]);
  }, [selectedUser?.id]);

  const handleSend = () => {
    if (!content.trim()) return;
    
    // Optimistic UI update
    const newMsg = {
      id: `opt_${Date.now()}`,
      content: content,
      senderId: user?.id,
      createdAt: new Date().toISOString()
    };
    
    setOptimisticMessages(prev => [...prev, newMsg]);
    setContent('');
    
    // Scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, optimisticMessages]);

  if (!user || convLoading) {
    return <div className="p-8 text-center text-white font-mono animate-pulse">Initializing Secure Uplink...</div>;
  }

  const allMessages = [...(messages || []), ...optimisticMessages];

  return (
    <div className={`h-[calc(100vh-140px)] animate-in fade-in duration-700 max-w-[1400px] mx-auto p-4 transition-colors ${isBurnerMode ? 'shadow-[inset_0_0_100px_rgba(255,0,0,0.1)]' : ''}`}>
      
      {/* Header */}
      <div className="flex justify-between items-end pb-4 mb-4 border-b border-white/10">
        <div>
          <h2 className={`text-3xl font-mono font-black uppercase tracking-tight flex items-center gap-3 transition-colors ${isBurnerMode ? 'text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]' : 'bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text'}`}>
            Secure Messenger {isBurnerMode && '(Burner Mode)'}
          </h2>
        </div>
      </div>

      <div className="flex h-[calc(100%-60px)] gap-6">
        
        {/* --- SIDEBAR (Contacts) --- */}
        <div className="w-1/3 max-w-sm flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          <div className="p-4 border-b border-white/10 bg-black/40">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search communications..." 
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:border-[var(--ledger-blue)] outline-none font-sans"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations?.map((conv) => (
              <button 
                key={conv.id}
                onClick={() => setSelectedUser(conv)}
                className={`w-full text-left p-4 border-b border-white/5 transition-all duration-300 flex items-center gap-4 ${selectedUser?.id === conv.id ? 'bg-[var(--ledger-blue)]/15 border-l-4 border-l-[var(--ledger-blue)]' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg font-mono border ${selectedUser?.id === conv.id ? 'bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/50' : 'bg-white/5 text-[var(--text-muted)] border-white/10'}`}>
                    {conv.name.charAt(0)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${conv.online ? 'bg-[var(--verify-green)]' : 'bg-[var(--text-muted)]'}`} />
                </div>
                
                <div className="overflow-hidden flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-white text-sm truncate">{conv.name}</h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {Math.floor(Math.random() * 12) + 1}:00 PM
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[var(--text-muted)] truncate opacity-80">{conv.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN CHAT WINDOW --- */}
        <div className={`flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-colors duration-500 ${isBurnerMode ? 'border-red-500/50' : ''}`}>
          
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between z-10 relative">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--ledger-blue)]/20 flex items-center justify-center font-bold text-[var(--ledger-blue)] font-mono border border-[var(--ledger-blue)]/50">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${selectedUser.online ? 'bg-[var(--verify-green)]' : 'bg-[var(--text-muted)]'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{selectedUser.name}</h3>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{selectedUser.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-[var(--text-muted)] hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
                    <Phone size={16} />
                  </button>
                  <button className="p-2 text-[var(--text-muted)] hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
                    <Video size={16} />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1"></div>
                  
                  {/* Burner Mode Toggle */}
                  <button 
                    onClick={() => setIsBurnerMode(!isBurnerMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 ${
                      isBurnerMode 
                        ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(255,0,0,0.6)] border-red-400' 
                        : 'bg-white/5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-white/5'
                    }`}
                  >
                    <Flame size={12} className={isBurnerMode ? 'animate-pulse' : ''} />
                    Burner
                  </button>
                  <button className="p-2 text-[var(--text-muted)] hover:text-white transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative" ref={scrollRef}>
                {/* Burner Mode Background Warning */}
                {isBurnerMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <Flame size={200} className="text-red-500 animate-pulse" />
                  </div>
                )}
                
                <div className="text-center pb-4">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    Encrypted Session Started
                  </span>
                </div>

                {msgLoading ? (
                  <div className="text-center font-mono text-[10px] text-[var(--text-muted)]">Loading secure messages...</div>
                ) : (
                  allMessages.map((msg, i) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[70%] p-4 rounded-2xl relative group ${
                          isMine 
                            ? isBurnerMode 
                                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-br-sm shadow-[0_4px_20px_rgba(255,0,0,0.3)]'
                                : 'bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-500 text-black rounded-br-sm shadow-[0_4px_20px_rgba(0,195,255,0.2)]' 
                            : 'bg-white/10 backdrop-blur-md text-white rounded-bl-sm border border-white/5 shadow-xl'
                        }`}>
                          <p className={`font-sans text-sm leading-relaxed ${isMine ? 'font-medium' : ''}`}>
                            {msg.content}
                          </p>
                          
                          {/* Message Metadata */}
                          <div className={`flex items-center gap-1 mt-2 text-[9px] font-mono ${isMine ? (isBurnerMode ? 'text-red-200' : 'text-cyan-900') : 'text-[var(--text-muted)]'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMine && <CheckCheck size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <div className="p-4 bg-black/40 border-t border-white/10">
                <div className={`flex items-center gap-3 p-2 rounded-2xl border transition-all duration-300 ${
                  isBurnerMode ? 'border-red-500/50 bg-red-500/5 focus-within:border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'border-white/10 bg-black/50 focus-within:border-[var(--ledger-blue)]/50 focus-within:bg-black'
                }`}>
                  <button className="p-2 text-[var(--text-muted)] hover:text-white transition-colors rounded-full hover:bg-white/10 shrink-0">
                    <Paperclip size={18} />
                  </button>
                  
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isBurnerMode ? "Type a self-destructing message..." : "Type your secure message..."}
                    className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 outline-none placeholder:text-white/30 font-sans"
                  />
                  
                  <button className="p-2 text-[var(--text-muted)] hover:text-white transition-colors rounded-full hover:bg-white/10 shrink-0">
                    <Smile size={18} />
                  </button>
                  
                  <button 
                    onClick={handleSend}
                    disabled={!content.trim()}
                    className={`p-2.5 rounded-xl shrink-0 transition-all duration-300 ${
                      content.trim() 
                        ? isBurnerMode
                          ? 'bg-red-500 text-black hover:brightness-110 shadow-[0_0_15px_rgba(255,0,0,0.4)]'
                          : 'bg-[var(--ledger-blue)] text-black hover:brightness-110 shadow-[0_0_15px_rgba(0,195,255,0.4)]'
                        : 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
                    }`}
                  >
                    <Send size={16} className={content.trim() ? 'translate-x-0.5' : ''} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <Search size={24} />
              </div>
              <p className="font-mono text-sm uppercase tracking-widest">Select a communication channel</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
