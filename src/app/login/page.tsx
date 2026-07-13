"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowUpRight, Eye, EyeOff } from "lucide-react";
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
      let role = data.user.user_metadata?.role || 'Employee';
      
      // If metadata says Employee, fallback to checking actual Prisma DB to ensure no sync issues
      if (role !== 'Admin') {
        const dbRole = await getUserRoleByEmail(email);
        if (dbRole === 'Admin') role = 'Admin';
      }
      
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md ledger-panel p-8 shadow-[var(--shadow-offset)] shadow-[var(--shadow-color)]">
        <div className="text-center mb-8 border-b ledger-border pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--bg-void)] border ledger-border mb-4">
            <Lock size={20} className={loginType === 'admin' ? 'text-[var(--signal-amber)]' : 'text-[var(--ledger-blue)]'} />
          </div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-widest ledger-text">
            {loginType === 'admin' ? 'Admin Portal' : 'Employee Portal'}
          </h1>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            {loginType === 'admin' ? 'Elevated Access Required' : 'Identity Verification Required'}
          </p>
        </div>

        <div className="flex w-full mb-6 border border-white/10 p-1 rounded-xl bg-black/40">
          <button 
            type="button"
            onClick={() => setLoginType('employee')}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest rounded-lg transition-all ${loginType === 'employee' ? 'bg-[var(--ledger-blue)] text-black font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Employee
          </button>
          <button 
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest rounded-lg transition-all ${loginType === 'admin' ? 'bg-[var(--signal-amber)] text-black font-bold shadow-[0_0_15px_rgba(255,170,0,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Administrator
          </button>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2 ledger-input text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className={`btn-primary w-full py-3 flex items-center justify-center gap-2 transition-all ${
              loginType === 'admin' 
                ? 'bg-[var(--signal-amber)] text-black hover:brightness-110 shadow-[0_0_20px_rgba(255,170,0,0.2)]' 
                : 'bg-[var(--ledger-blue)] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.2)]'
            }`}
          >
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
