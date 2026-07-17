'use client';

import React, { useState } from 'react';
import { Zap, Flame } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = ['Appreciation', 'Teamwork', 'Leadership', 'Innovation', 'Customer Love'];

export default function RecognitionIsland() {
  const { user } = useUser();
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Appreciation');

  const utils = trpc.useUtils();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' });
  const sendKudo = trpc.recognition.sendKudo.useMutation({
    onSuccess: () => {
      utils.recognition.getRecentKudos.invalidate();
      utils.kudoLeaderboard.invalidate();
      setReceiverId('');
      setMessage('');
      setCategory('Appreciation');
    },
  });

  const colleagues = (users || []).filter((u: any) => u.id !== user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !message.trim()) return;
    sendKudo.mutate({ receiverId, message, category });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Recipient Colleague</label>
        <select
          required
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="ledger-input flex h-10 w-full rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="">Select a champion...</option>
          {colleagues.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} ({c.designation || 'Staff'})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${category === c ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Message of Praise</label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Thank you for being awesome because..."
          className="ledger-input flex w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={sendKudo.isPending || !receiverId || !message.trim()}
        variant="primary"
        className="w-full"
      >
        <Flame size={18} /> Ignite Recognition
      </Button>
    </form>
  );
}
