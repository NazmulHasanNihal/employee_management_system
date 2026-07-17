'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : Array.isArray(params.token) ? params.token[0] : '';

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/invite/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus('invalid');
          setErrorMsg(data.error || 'Invalid invite link.');
        } else {
          setEmail(data.email);
          setRole(data.role);
          setStatus('ready');
        }
      } catch {
        setStatus('invalid');
        setErrorMsg('Unable to verify invite link.');
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Failed to set password.');
        return;
      }
      // Sign the user in with their new credentials, then go to onboarding.
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // Account is ready; send them to login to authenticate.
        router.push('/login');
        return;
      }
      router.push('/');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="ledger-card rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Mail size={22} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              Accept invitation
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Set up your secure account
            </p>
          </div>

          {status === 'loading' && (
            <p className="text-center text-sm text-[var(--text-muted)]">Verifying invite…</p>
          )}

          {status === 'invalid' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]">
              <AlertTriangle size={15} /> {errorMsg}
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl bg-[var(--bg-hover)] p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Invited as</p>
                <p className="font-semibold text-[var(--text-main)]">{email}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{role}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ledger-input w-full rounded-xl py-2.5 pl-4 pr-11 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">Confirm password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="ledger-input w-full rounded-xl py-2.5 pl-4 pr-4 text-sm"
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm"
              >
                <KeyRound size={16} /> Activate account
              </button>
            </form>
          )}

          {status === 'done' && (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto text-[var(--emerald)]" size={40} />
              <p className="font-semibold text-[var(--emerald)]">Account activated</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]">
                {errorMsg}
              </div>
              <button onClick={() => setStatus('ready')} className="btn-primary w-full rounded-xl py-2.5 text-sm">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
