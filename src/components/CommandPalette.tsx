"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, X, Search, Activity, User, Briefcase, Command } from "lucide-react";
import { useRouter } from "next/navigation";


export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  if (!open) return null;

  const handleCommand = async (cmd: string) => {
    const parts = cmd.trim().split(" ");
    const action = parts[0]?.toLowerCase();

    if (action === "/go") {
      const dest = parts[1]?.toLowerCase();
      if (dest) {
        router.push(`/${dest}`);
      }
    } else if (action === "/theme") {
      document.body.classList.toggle("light-mode");

    }

    setOpen(false);
  };

  const getResults = () => {
    const results = [];
    if (!query) {
      return [
        { icon: <Command size={14}/>, label: "Type /go [page] to navigate (e.g. /go payroll)" },

        { icon: <Activity size={14}/>, label: "Type /theme toggle to switch modes" },
        { icon: <Terminal size={14}/>, label: "Type /macro eom to execute EOM routine" }
      ];
    }
    
    const queryResults = [];
    if (query.startsWith("/go")) {
      queryResults.push({ icon: <Search size={14}/>, label: `Navigate to /${query.split(" ")[1] || "..."}`, action: () => handleCommand(query) });
    } else if (query.startsWith("/theme")) {
      queryResults.push({ icon: <Activity size={14}/>, label: `Toggle Theme`, action: () => handleCommand(query) });
    } else if (query.startsWith("/macro")) {
      queryResults.push({ 
        icon: <Terminal size={14}/>, 
        label: `Execute EOM Macro: Archive and Payroll`, 
        action: () => {
          alert("EOM MACRO EXECUTED: Payroll calculations initiated. Support tickets archived.");
          setOpen(false);
          setQuery('');
        }
      });
    } else {
      queryResults.push({ icon: <Terminal size={14}/>, label: `Execute: ${query}`, action: () => handleCommand(query) });
    }
    return queryResults;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-start justify-center pt-32 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--ledger-blue)] shadow-[0_0_20px_rgba(0,195,255,0.2)] shadow-[var(--ledger-blue)] flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-[var(--ledger-blue)]/30">
          <Terminal className="text-[var(--ledger-blue)] animate-pulse" size={20} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none font-mono text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
            placeholder="Type a command or search... (/go, /kudo)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommand(query);
            }}
          />
          <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-2">
          {getResults().map((res: any, i) => (
            <button 
              key={i}
              onClick={res.action}
              className="w-full flex items-center gap-3 p-3 font-mono text-sm text-[var(--text-muted)] hover:bg-[var(--ledger-blue)]/10 hover:text-[var(--text-main)] hover:border-l-2 border-[var(--ledger-blue)] transition-all text-left"
            >
              {res.icon}
              {res.label}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-[var(--ledger-blue)]/30 text-xs font-mono text-[var(--text-muted)] flex justify-between bg-[var(--bg-void)]">
          <span>EMS COMMAND CENTER v1.0</span>
          <span>Use &uarr;&darr; to navigate, &crarr; to select</span>
        </div>
      </div>
    </div>
  );
}
