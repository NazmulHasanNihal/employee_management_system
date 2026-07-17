'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MailCheck, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Verify-email gate (P0). Reached when an authenticated user's auth email is
 * not yet confirmed. Lets them resend the confirmation and refresh status.
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) setEmail(data.user.email);
      // If already confirmed (e.g. they clicked the link in another tab), bounce in.
      if (data.user?.email_confirmed_at) router.replace('/');
    })();
  }, [router]);

  const resend = async () => {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.email_confirmed_at) router.replace('/');
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="ledger-card rounded-2xl p-8 text-center shadow-[var(--shadow-lg)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <MailCheck size={26} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-main)]">
            Verify your email
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Confirmation required to continue
          </p>

          <p className="mt-5 text-sm text-[var(--text-muted)]">
            We sent a verification link to{' '}
            <span className="font-semibold text-[var(--text-main)]">{email || 'your email'}</span>.
            Click the link in that email, then refresh below.
          </p>

          {sent && (
            <p className="mt-4 rounded-xl border border-[var(--emerald)]/40 bg-[var(--emerald-soft)] px-3 py-2 text-sm font-medium text-[var(--emerald)]">
              ✔ Confirmation email resent
            </p>
          )}
          {error && (
            <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2 text-sm font-medium text-[var(--rose)]">
              <ShieldAlert size={14} /> {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={refresh}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
            >
              <RefreshCw size={15} /> I&apos;ve verified — refresh
            </button>
            <button
              onClick={resend}
              disabled={loading}
              className="rounded-xl border border-[var(--border-hairline)] py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Resend verification email'}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--rose)]"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
