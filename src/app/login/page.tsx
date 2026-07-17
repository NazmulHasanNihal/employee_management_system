"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRoleByEmail } from "@/app/actions/admin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'employee' | 'admin'>('employee');
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      let errorMessage = error.message;
      if (errorMessage === "{}" || !errorMessage) {
        errorMessage = "Invalid login credentials. Please try again.";
      }
      setError(errorMessage);
    } else if (data?.user) {
      // Authoritative role comes from the Prisma DB (set during provisioning),
      // not from mutable user_metadata. This prevents privilege escalation via
      // tampered auth metadata.
      const role = await getUserRoleByEmail(email);

      if (loginType === 'admin' && role !== 'Admin') {
        await supabase.auth.signOut();
        setError("Access denied. You do not have Administrator privileges.");
        return;
      }

      if (loginType === 'employee' && role === 'Admin') {
        await supabase.auth.signOut();
        setError("Please use the Administrator portal to log in.");
        return;
      }

      window.location.href = "/";
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email address to reset your password.");
      return;
    }
    setError("");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setError("If that email exists, a password reset link has been sent.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="ledger-card rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]">
              <Lock size={22} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {loginType === 'admin' ? 'Admin Sign In' : 'Welcome Back'}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {loginType === 'admin'
                ? 'Elevated access for system administrators'
                : 'Sign in to your EMS workspace'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] p-1">
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                loginType === 'employee'
                  ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <UserRound size={15} /> Employee
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                loginType === 'admin'
                  ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <ShieldCheck size={15} /> Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ledger-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ledger-input w-full rounded-xl py-2.5 pl-4 pr-11 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm">
              Sign in <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-[var(--brand)] transition-colors hover:underline"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          EMS Ledger · Enterprise Management System
        </p>
      </div>
    </div>
  );
}
