"use client";

import { useState } from "react";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserRound, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginWithRateLimit } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { T } from "@/components/Translate";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'employee' | 'admin'>('employee');
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [tempSessionId, setTempSessionId] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoverySent, setIsRecoverySent] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateCode = (value: string) => {
    if (!value) return "Verification code is required";
    if (!/^\d{6}$/.test(value)) return "Enter a valid 6-digit code";
    return "";
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passErr);
    setError("");

    if (emailErr || passErr) return;

    setLoading(true);
    try {
      const result = await loginWithRateLimit(email, password);
      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTempSessionId(result.sessionId);
      } else if ('user' in result && result.user) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeErr = validateCode(code);
    setCodeError(codeErr);
    setError("");

    if (codeErr || !tempSessionId) return;

    setLoading(true);
    try {
      const result = await loginWithRateLimit(email, password, code, tempSessionId);
      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('user' in result && result.user) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPassword = () => {
    setRequiresTwoFactor(false);
    setTempSessionId(null);
    setCode("");
    setCodeError("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    if (emailErr) return;

    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    
    if (resetError) {
      setError(resetError.message);
    } else {
      setIsRecoverySent(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]">
              {requiresTwoFactor ? <KeyRound size={22} /> : <Lock size={22} />}
            </div>
             <h1 className="text-fluid-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {/* @ts-ignore */}<T>{isForgotPassword ? 'Reset Password' : requiresTwoFactor ? 'Two-Factor Authentication' : (loginType === 'admin' ? 'Admin Sign In' : 'Welcome Back')}</T>
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {/* @ts-ignore */}<T>{isForgotPassword
                ? 'Enter your email to receive a recovery link'
                : requiresTwoFactor
                ? 'Enter the 6-digit code from your authenticator app'
                : (loginType === 'admin'
                  ? 'Elevated access for system administrators'
                  : 'Sign in to your EMS workspace')}</T>
            </p>
          </div>

          {!requiresTwoFactor && !isForgotPassword && (
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
                <UserRound size={15} /> {/* @ts-ignore */}<T>Employee</T></button>
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                  loginType === 'admin'
                    ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <ShieldCheck size={15} /> {/* @ts-ignore */}<T>Admin</T></button>
            </div>
          )}

          {error && (
            <div id="login-error" className="mb-4 rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]" role="alert">
              {error}
            </div>
          )}
          {isForgotPassword ? (
            isRecoverySent ? (
              <div className="text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Mail size={24} />
                </div>
                <h2 className="mb-2 text-xl font-semibold">{/* @ts-ignore */}<T>Check your email</T></h2>
                <p className="mb-6 text-sm text-[var(--text-muted)]">
                  {/* @ts-ignore */}<T>We sent a password recovery link to</T> <strong>{email}</strong>
                </p>
                <button type="button" onClick={() => { setIsForgotPassword(false); setIsRecoverySent(false); }} className="w-full btn-primary py-2.5 rounded-xl">
                  {/* @ts-ignore */}<T>Back to login</T>
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                    {/* @ts-ignore */}<T>Email address</T>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); }}
                      className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl py-2.5 pl-10 pr-4 text-sm", emailError && "border-[var(--rose)]")}
                      placeholder="you@company.com"
                    />
                  </div>
                  {emailError && <p className="mt-1 text-xs text-[var(--rose)]">{emailError}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:opacity-60">
                  {loading ? "Sending..." : <>{/* @ts-ignore */}<T>Send Recovery Link</T><ArrowRight size={16} /></>}
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-center text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]">
                  {/* @ts-ignore */}<T>Back to login</T>
                </button>
              </form>
            )
          ) : !requiresTwoFactor ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                  {/* @ts-ignore */}<T>Email address</T></label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); }}
                    className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl py-2.5 pl-10 pr-4 text-sm", emailError && "border-[var(--rose)]")}
                    placeholder="you@company.com"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'email-error' : (error ? 'login-error' : undefined)}
                  />
                </div>
                {emailError && <p id="email-error" className="mt-1 text-xs text-[var(--rose)]">{emailError}</p>}
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                  {/* @ts-ignore */}<T>Password</T></label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(validatePassword(e.target.value)); }}
                    className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl py-2.5 pl-4 pr-11 text-sm", passwordError && "border-[var(--rose)]")}
                    placeholder="••••••••"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'password-error' : (error ? 'login-error' : undefined)}
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
                {passwordError && <p id="password-error" className="mt-1 text-xs text-[var(--rose)]">{passwordError}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:opacity-60">
                {loading ? "Signing in…" : <>{/* @ts-ignore */}<T>Sign in</T><ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeLogin} className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                  {/* @ts-ignore */}<T>Verification Code</T></label>
                <div className="relative">
                  <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); if (codeError) setCodeError(validateCode(e.target.value)); }}
                    className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl py-2.5 pl-10 pr-4 text-sm tracking-widest", codeError && "border-[var(--rose)]")}
                    placeholder="000000"
                    autoFocus
                    aria-invalid={Boolean(codeError)}
                    aria-describedby={codeError ? 'code-error' : (error ? 'login-error' : undefined)}
                  />
                </div>
                {codeError && <p id="code-error" className="mt-1 text-xs text-[var(--rose)]">{codeError}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:opacity-60">
                {loading ? "Verifying…" : <>{/* @ts-ignore */}<T>Verify</T><ArrowRight size={16} /></>}
              </button>
              <button type="button" onClick={handleBackToPassword} className="w-full text-center text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]">
                {/* @ts-ignore */}<T>Back to password</T></button>
            </form>
          )}
          {!requiresTwoFactor && !isForgotPassword && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(true); setError(""); setEmailError(""); }}
                className="text-sm font-medium text-[var(--brand)] transition-colors hover:underline"
              >
                {/* @ts-ignore */}<T>Forgot your password?</T></button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          {/* @ts-ignore */}<T>OpsHub · Enterprise Operations Hub</T></p>
      </div>
    </div>
  );
}
