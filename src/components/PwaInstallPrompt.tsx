"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T } from "@/components/Translate";

/**
 * PWA install prompt (Tier 9). Listens for the browser's `beforeinstallprompt`
 * event and offers a one-tap install. Hidden once installed or if the browser
 * doesn't support installation (e.g. already installed / desktop Safari).
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  if (installed || !deferred || dismissed) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-2.5 shadow-xl backdrop-blur-md">
      <Download className="h-4 w-4 text-[var(--brand)] shrink-0" />
      <span className="text-xs font-medium text-[var(--text-main)]">{/* @ts-ignore */}<T>Install EMS App</T></span>
      <Button size="sm" onClick={install} className="h-7 text-xs px-3">
        {/* @ts-ignore */}<T>Install</T></Button>
      <button 
        onClick={() => setDismissed(true)} 
        aria-label="Dismiss install prompt"
        className="ml-1 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Minimal typing for the non-standard event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
