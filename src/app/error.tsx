"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T } from "@/components/Translate";

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-6">
      <div className="ledger-accent" />
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center rounded-2xl p-8 text-center bg-[var(--bg-panel)] border border-[var(--border-hairline)] shadow-[var(--shadow-lg)]">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--rose-soft)] text-[var(--rose)]">
          <ShieldAlert className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <h2 className="text-fluid-2xl font-extrabold tracking-tight text-[var(--text-main)]">
          {/* @ts-ignore */}<T>Something went wrong</T></h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
          {/* @ts-ignore */}<T>A critical exception occurred while loading this page. The error has been logged and our team has been notified.</T></p>

        <div className="mt-5 w-full max-w-lg rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] p-4 text-left">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--rose)]">
            {/* @ts-ignore */}<T>Error details</T></p>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {error.message || "Unknown runtime error"}
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-[var(--text-muted)] opacity-70">
              {/* @ts-ignore */}<T>Digest:</T>{error.digest}
            </p>
          )}
        </div>

        <Button
          onClick={() => reset()}
          className="mt-2 rounded-xl px-8 py-3 text-sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {/* @ts-ignore */}<T>Try again</T></Button>
      </div>
    </div>
  );
}
