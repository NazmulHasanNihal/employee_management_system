'use client';

import React, { useState } from 'react';
import { CheckCircle2, Rocket } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import { useAppStore } from '@/lib/store';

export default function OnboardingFlow({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const { language } = useAppStore();
  const t = useTranslation(language);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContact: '', photoUploaded: false, avatarUrl: null }),
      });
      if (res.ok) {
        window.location.href = '/'; // Force reload to bypass layout state
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[var(--bg-panel)] border ledger-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div className="h-full bg-[var(--ledger-blue)] transition-all duration-500 w-full" />
        </div>

        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto w-16 h-16 bg-[var(--ledger-blue)]/10 border border-[var(--ledger-blue)]/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(var(--ledger-blue-rgb),0.2)]">
            <Rocket className="text-[var(--ledger-blue)]" size={32} />
          </div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-widest text-white mb-2">
            {t('Welcome to the Platform')}
          </h1>
          <p className="text-[var(--text-muted)] mb-8 font-mono text-sm leading-relaxed">
            {t('Your identity has been authenticated as')} <strong className="text-[var(--ledger-blue)]">{user?.name}</strong>.
            <br />{t('Click below to initialize your workspace instance.')}
          </p>

          <button 
            onClick={completeOnboarding}
            disabled={loading}
            className="w-full py-4 bg-[var(--verify-green)] text-black font-bold font-mono uppercase tracking-widest rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--verify-green-rgb),0.3)] disabled:opacity-50"
          >
            {loading ? t('Initializing Workspace...') : <><CheckCircle2 size={18} /> {t('Initialize Workspace')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
