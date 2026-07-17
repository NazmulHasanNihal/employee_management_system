"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Terminal, X, Search, Activity, User, Briefcase, Command, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "@/lib/toast";
import { navCategories } from "@/components/nav-config";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  adminOnly?: boolean;
  hideForContractor?: boolean;
}

// Flatten the nav tree into a single searchable index.
const NAV_INDEX: NavItem[] = navCategories.flatMap((cat) => cat.items);

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleCommand = useCallback((cmd: string) => {
    const parts = cmd.trim().split(" ");
    const action = parts[0]?.toLowerCase();

    if (action === "/go") {
      const dest = parts[1]?.toLowerCase();
      if (dest) router.push(`/${dest}`);
    } else if (action === "/theme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    setOpen(false);
  }, [router, resolvedTheme, setTheme]);

  interface CmdResult {
    icon: React.ReactNode;
    label: string;
    action?: () => void;
  }

  const getResults = useMemo<CmdResult[]>(() => {
    const q = query.trim();

    // Slash commands keep their dedicated behavior.
    if (q.startsWith("/go") || q.startsWith("/theme") || q.startsWith("/macro")) {
      if (q.startsWith("/go")) {
        const dest = q.split(" ")[1];
        return [{ icon: <Search size={14} />, label: `Navigate to /${dest || "..."}`, action: () => handleCommand(q) }];
      }
      if (q.startsWith("/theme")) {
        return [{ icon: <Activity size={14} />, label: `Toggle Theme (currently ${resolvedTheme ?? "system"})`, action: () => handleCommand(q) }];
      }
      return [{
        icon: <Terminal size={14} />,
        label: "Execute EOM Macro: Archive and Payroll",
        action: () => { toast.success("EOM Macro Executed", "Payroll calculations initiated. Support tickets archived."); setOpen(false); setQuery(""); },
      }];
    }

    if (!q) {
      // Default suggestions: a few popular destinations + commands.
      return [
        ...NAV_INDEX.slice(0, 5).map((item) => ({
          icon: React.createElement(item.icon, { size: 14 }),
          label: `Go to ${item.label}`,
          action: () => router.push(item.path),
        })),
        { icon: <Activity size={14} />, label: "Type /theme to toggle light / dark" },
        { icon: <Terminal size={14} />, label: "Type /macro eom to run the EOM routine" },
      ];
    }

    // Free-text search over the nav index (label match; fallback prefix).
    const lower = q.toLowerCase();
    const matches = NAV_INDEX.filter(
      (item) => item.label.toLowerCase().includes(lower)
    ).slice(0, 8);

    if (matches.length === 0) {
      return [{ icon: <Terminal size={14} />, label: `No matches for "${q}"`, action: () => {} }];
    }
    return matches.map((item) => ({
      icon: React.createElement(item.icon, { size: 14 }),
      label: `Go to ${item.label}`,
      action: () => { router.push(item.path); setOpen(false); },
    }));
  }, [query, resolvedTheme, handleCommand, router]);

  const handleSelect = useCallback((res: CmdResult) => {
    if (res.action) res.action();
    else handleCommand(query);
  }, [query, handleCommand]);

  // Clamp selection when results change
  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, getResults.length - 1)));
  }, [getResults.length]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % getResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + getResults.length) % getResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(getResults[selected]);
    };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex animate-in items-start justify-center bg-black/80 pt-32 fade-in duration-200"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="flex max-h-[70vh] w-full max-w-2xl flex-col border border-[var(--ledger-blue)] shadow-[0_0_20px_rgba(0,195,255,0.2)]">
        <div className="flex items-center gap-3 border-b border-[var(--ledger-blue)]/30 p-4">
          <Terminal className="animate-pulse text-[var(--ledger-blue)]" size={20} />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={`cmd-item-${selected}`}
            className="flex-1 border-none bg-transparent font-mono text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Type a command or search... (/go, /theme, /macro)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button aria-label="Close" onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div id="cmd-list" ref={listRef} role="listbox" aria-label="Command results" className="custom-scrollbar max-h-96 overflow-y-auto p-2">
          {getResults.map((res: any, i) => (
            <button
              key={i}
              id={`cmd-item-${i}`}
              role="option"
              aria-selected={i === selected}
              onMouseEnter={() => setSelected(i)}
              onClick={() => handleSelect(res)}
              className={`flex w-full items-center justify-between border-l-2 p-3 text-left font-mono text-sm transition-all ${
                i === selected
                  ? "border-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10 text-[var(--text-main)]"
                  : "border-transparent text-[var(--text-muted)] hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3">
                {res.icon}
                {res.label}
              </span>
              {i === selected && <CornerDownLeft size={12} className="text-[var(--ledger-blue)]" />}
            </button>
          ))}
        </div>
        <div className="flex justify-between border-t border-[var(--ledger-blue)]/30 bg-[var(--bg-void)] p-2 text-xs font-mono text-[var(--text-muted)]">
          <span>EMS COMMAND CENTER v1.0</span>
          <span>Type to search · &uarr;&darr; navigate · &crarr; select · ESC close</span>
        </div>
      </div>
    </div>
  );
}
