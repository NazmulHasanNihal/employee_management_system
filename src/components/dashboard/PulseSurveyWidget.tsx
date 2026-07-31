'use client';

import React, { useState } from 'react';
import { HeartPulse, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

const MOODS = [
  { emoji: '😡', label: 'Angry', value: 1, color: 'hover:bg-rose-100 hover:border-rose-500' },
  { emoji: '🙁', label: 'Stressed', value: 2, color: 'hover:bg-amber-100 hover:border-amber-500' },
  { emoji: '😐', label: 'Okay', value: 3, color: 'hover:bg-gray-100 hover:border-gray-500' },
  { emoji: '🙂', label: 'Good', value: 4, color: 'hover:bg-blue-100 hover:border-blue-500' },
  { emoji: '🤩', label: 'Great', value: 5, color: 'hover:bg-emerald-100 hover:border-emerald-500' },
];

export function PulseSurveyWidget() {
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selected === null) return;
    // In a real app, send to TRPC mutation
    setSubmitted(true);
    toast.success('Feedback Recorded', 'Thank you for submitting your weekly pulse check!');
  };

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse size={16} className="text-[var(--rose)]" /> Weekly Pulse Survey
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-main)]">Thank you!</p>
              <p className="text-xs text-[var(--text-muted)]">Your response helps us improve the workplace.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">How are you feeling about work this week?</p>
            <div className="flex justify-between gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelected(m.value)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] py-3 transition-all ${m.color} ${selected === m.value ? 'ring-2 ring-[var(--brand)] scale-105 shadow-md' : 'hover:scale-105'}`}
                  title={m.label}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{m.label}</span>
                </button>
              ))}
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={selected === null}
              className="w-full btn-primary"
            >
              Submit Anonymous Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
