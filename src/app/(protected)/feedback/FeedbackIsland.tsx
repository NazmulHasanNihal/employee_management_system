'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, EyeOff } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { T } from "@/components/Translate";

interface FeedbackIslandProps {
  isAdmin: boolean;
}

const CATEGORIES = ['Suggestion', 'Concern', 'Culture', 'Facilities'];

export default function FeedbackIsland({ isAdmin }: FeedbackIslandProps) {
  const [category, setCategory] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();
  const submitFeedback = trpc.feedback.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setMessage('');
      setTimeout(() => setSubmitted(false), 3000);
      if (isAdmin) utils.feedback.getAllFeedback.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitFeedback.mutate({ type: category, content: message, anonymous: isAnonymous });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="mb-4 text-[var(--emerald)]" size={48} />
        <h4 className="text-lg font-bold text-[var(--text-main)]">{/* @ts-ignore */}<T>Securely Transmitted</T></h4>
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">{/* @ts-ignore */}<T>Your feedback has been encrypted and delivered.</T></p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Classification</T></label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex h-10 w-full rounded-xl px-3 py-2 text-sm outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'Suggestion' ? 'Suggestion / Idea' : c === 'Concern' ? 'Concern / Issue' : c === 'Culture' ? 'Company Culture' : 'Facilities / Office'}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Message Payload</T></label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts safely and securely..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anon"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-5 w-5 rounded border-[var(--border-hairline)] accent-[var(--rose)]"
          />
          <label htmlFor="anon" className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide text-[var(--text-main)]">
            {/* @ts-ignore */}<T>Ghost Mode (Anonymous)</T></label>
        </div>
        <EyeOff size={16} className={isAnonymous ? 'text-[var(--rose)]' : 'text-[var(--text-muted)]'} />
      </div>

      <Button type="submit" disabled={submitFeedback.isPending || !message.trim()} variant="primary" className="w-full">
        <Send size={18} /> {/* @ts-ignore */}<T>Transmit Payload</T></Button>
    </form>
  );
}

export function FeedbackMarkReviewedButton({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.feedback.updateFeedbackStatus.useMutation({
    onSuccess: () => utils.feedback.getAllFeedback.invalidate(),
  });
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-[var(--emerald)] border-[var(--emerald)]/40 hover:bg-[var(--emerald-soft)]"
      onClick={() => updateStatus.mutate({ id, status: 'REVIEWED' })}
      disabled={updateStatus.isPending}
    >
      {/* @ts-ignore */}<T>Mark Reviewed</T></Button>
  );
}
