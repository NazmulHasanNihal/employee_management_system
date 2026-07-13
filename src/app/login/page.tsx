"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message || "Login failed");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md ledger-panel p-8 shadow-[var(--shadow-offset)] shadow-[var(--shadow-color)]">
        <div className="text-center mb-8 border-b ledger-border pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--bg-void)] border ledger-border mb-4">
            <Lock size={20} className="text-[var(--signal-amber)]" />
          </div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-widest ledger-text">
            System Login
          </h1>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            Identity Verification Required
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-[var(--alert-red)] bg-[var(--alert-red)]/10 text-[var(--alert-red)] text-xs font-mono font-bold uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 ledger-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 ledger-input text-sm"
                placeholder="operator@system.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono ledger-muted uppercase tracking-widest mb-1">
              Passphrase
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 ledger-input text-sm"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            Authenticate <ArrowUpRight size={16} />
          </button>
        </form>

        <div className="relative border-t ledger-border pt-6">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] px-2 text-[10px] font-mono ledger-muted uppercase">
            System Locked
          </span>
        </div>
      </div>
    </div>
  );
}
