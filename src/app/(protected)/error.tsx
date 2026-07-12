"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-[var(--alert-red)]/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="bg-black/80 backdrop-blur-xl border border-[var(--alert-red)]/50 p-6 rounded-3xl relative z-10 shadow-[0_0_50px_rgba(255,51,102,0.2)]">
          <ShieldAlert className="text-[var(--alert-red)] w-24 h-24 mx-auto" strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-black font-mono text-white tracking-tighter uppercase">
          System Fault
        </h2>
        <p className="text-sm font-mono text-[var(--text-muted)]">
          A critical exception occurred while attempting to render this module. Our telemetry has logged the error.
        </p>
      </div>

      <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-left max-w-lg w-full overflow-hidden">
        <p className="text-[10px] font-mono text-[var(--alert-red)] uppercase mb-2 font-bold tracking-widest">
          Stack Trace Preview
        </p>
        <p className="text-[10px] font-mono text-white/70 truncate">
          {error.message || "Unknown Runtime Error"}
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-white/50 mt-1">
            Digest: {error.digest}
          </p>
        )}
      </div>

      <Button 
        onClick={() => reset()}
        className="bg-transparent border-2 border-[var(--alert-red)] text-[var(--alert-red)] hover:bg-[var(--alert-red)] hover:text-black hover:shadow-[0_0_20px_var(--alert-red)] font-mono font-bold uppercase tracking-widest px-8 py-6 rounded-xl transition-all"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reboot Module
      </Button>
    </div>
  );
}
