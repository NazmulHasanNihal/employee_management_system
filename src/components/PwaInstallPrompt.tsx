"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PWA install prompt (Tier 9). Listens for the browser's `beforeinstallprompt`
 * event and offers a one-tap install. Hidden once installed or if the browser
 * doesn't support installation (e.g. already installed / desktop Safari).
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-3 shadow-lg md:bottom-4">
      <Download className="h-4 w-4 text-[var(--text-muted)]" />
      <span className="text-xs font-mono text-[var(--text-muted)]">Install EMS</span>
      <Button size="sm" onClick={install}>
        Install
      </Button>
    </div>
  );
}

// Minimal typing for the non-standard event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
