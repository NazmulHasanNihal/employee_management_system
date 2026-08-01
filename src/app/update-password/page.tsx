"use client";

import { useState } from "react";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { updatePassword } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { T } from "@/components/Translate";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const passErr = validatePassword(password);
    setPasswordError(passErr);
    setError("");

    if (passErr) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]">
              <Lock size={22} />
            </div>
             <h1 className="text-fluid-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {/* @ts-ignore */}<T>Set New Password</T>
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {/* @ts-ignore */}<T>Enter a new password for your account.</T>
            </p>
          </div>

          {error && (
            <div id="update-error" className="mb-4 rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                {/* @ts-ignore */}<T>New Password</T></label>
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
            
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">
                {/* @ts-ignore */}<T>Confirm New Password</T></label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl py-2.5 px-4 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:opacity-60">
              {loading ? "Updating…" : <>{/* @ts-ignore */}<T>Update Password</T><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
