"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX, KeyRound, Copy, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpAuthUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const statusQuery = trpc.twofactor.getTwoFactorStatus.useQuery(undefined, {
    onSuccess: (data: { enabled: boolean }) => {
      setEnabled(data.enabled);
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  const setupMutation = trpc.twofactor.setupTwoFactor.useMutation({
    onSuccess: (data: { secret: string; otpAuthUri: string }) => {
      setSetupData(data);
      setStep('verify');
      setSetupLoading(false);
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to setup 2FA');
      setSetupLoading(false);
    },
  });

  const enableMutation = trpc.twofactor.enableTwoFactor.useMutation({
    onSuccess: () => {
      setEnabled(true);
      setStep('idle');
      setSetupData(null);
      setCode("");
      setError("");
      statusQuery.refetch();
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to enable 2FA');
    },
  });

  const disableMutation = trpc.twofactor.disableTwoFactor.useMutation({
    onSuccess: () => {
      setEnabled(false);
      setCode("");
      setError("");
      statusQuery.refetch();
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to disable 2FA');
    },
  });

  const handleSetup = async () => {
    setSetupLoading(true);
    setError("");
    setupMutation.mutateAsync();
  };

  const handleEnable = async () => {
    if (!code || code.length !== 6) {
      setError("Enter a valid 6-digit code");
      return;
    }
    enableMutation.mutateAsync(code);
  };

  const handleDisable = async () => {
    if (!code || code.length !== 6) {
      setError("Enter a valid 6-digit code to disable 2FA");
      return;
    }
    disableMutation.mutateAsync(code);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">Loading…</div>;
  }

  if (enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">Two-factor authentication is enabled</p>
            <p className="text-xs text-[var(--text-muted)]">Your account is protected with TOTP authenticator</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="disable-code" className="text-sm font-medium text-[var(--text-main)]">
            Enter code to disable 2FA
          </label>
          <input
            id="disable-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="ledger-input w-full rounded-xl py-2.5 px-4 text-sm tracking-widest"
            placeholder="000000"
          />
            <Button
              variant="danger"
              onClick={handleDisable}
              disabled={disableMutation.isPending}
              className="w-full"
            >
            <XCircle size={16} /> Disable Two-Factor Authentication
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'setup' && setupData) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--text-main)]">1. Scan this QR code in your authenticator app</p>
          <div className="flex items-center gap-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setupData.otpAuthUri)}`}
              alt="2FA QR code"
              className="rounded-lg border border-[var(--border-hairline)]"
              width={150}
              height={150}
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs text-[var(--text-muted)]">Or enter this secret manually:</p>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-2">
                <code className="flex-1 break-all text-xs font-mono">{setupData.secret}</code>
                <button
                  onClick={() => copyToClipboard(setupData.secret)}
                  className="shrink-0 rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
                  aria-label="Copy secret"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-main)]">2. Enter the 6-digit code from your app</p>
          <div className="flex gap-2">
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="ledger-input flex-1 rounded-xl py-2.5 px-4 text-sm tracking-widest"
              placeholder="000000"
              autoFocus
            />
            <Button
              onClick={handleEnable}
              disabled={enableMutation.isPending}
            >
              <KeyRound size={16} /> Verify
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
        <ShieldX className="h-6 w-6 text-[var(--text-muted)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-main)]">Two-factor authentication is not enabled</p>
          <p className="text-xs text-[var(--text-muted)]">Add an extra layer of security to your account</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] px-3 py-2.5 text-sm font-medium text-[var(--rose)]" role="alert">
          {error}
        </div>
      )}

      {step === 'idle' && !setupData && (
        <Button variant="secondary" onClick={handleSetup} disabled={setupLoading}>
          <ShieldCheck size={16} /> Enable Two-Factor Authentication
        </Button>
      )}
    </div>
  );
}
