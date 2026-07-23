'use client';

import React, { useState, useMemo } from 'react';
import { Network, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';

interface Employee {
  id: string;
  name: string;
  role?: string | null;
  department?: string | null;
  designation?: string | null;
}

interface Presence {
  id: string;
}

export default function PresenceGrid({ employees, active }: { employees: Employee[]; active: Presence[] }) {
  const [query, setQuery] = useState('');
  const activeIds = useMemo(() => new Set(active.map((a) => a.id)), [active]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) =>
      [emp.name, emp.department, emp.role].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
    );
  }, [employees, query]);

  // Deterministic grid positions based on string hashing (stable, no Math.random)
  const gridCells = useMemo(() => {
    if (!filtered || filtered.length === 0) return { size: 12, cells: [] as (Employee | null)[] };
    const size = 12;
    const cells = Array(size * size).fill(null) as (Employee | null)[];

    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs(hash);
    };

    filtered.forEach((emp) => {
      let idx = getHash(emp.id) % (size * size);
      while (cells[idx] !== null) idx = (idx + 1) % (size * size);
      cells[idx] = emp;
    });

    return { size, cells };
  }, [filtered]);

  return (
    <div className="flex h-full flex-col space-y-6 pb-20 md:pb-0">
      <div className="flex items-end justify-between border-b border-[var(--border-hairline)] pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-fluid-xl font-semibold text-[var(--text-main)]">
            <Network className="h-6 w-6 text-[var(--brand)]" /> The Grid
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Spatial Presence & Telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-3 py-1">
            <Search className="h-3 w-3 text-[var(--text-muted)]" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="LOCATE ASSET..." className="w-32 bg-transparent text-[10px] uppercase outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          <span className="flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-3 py-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            {filtered.length} / {employees.length}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)]/60 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--border-hairline)_1px,_transparent_1px)] bg-[size:40px_40px] opacity-20" />

        <div className="relative z-10 mb-4 flex shrink-0 justify-end gap-4 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 animate-pulse rounded-full bg-[var(--emerald)] shadow-[0_0_8px_var(--emerald)]" /> Online</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--amber)]" /> Away</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-[var(--border-hairline)]" /> Offline</span>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center overflow-auto p-4">
          <div
            className="grid gap-2 border border-[var(--brand)]/20 bg-[var(--bg-app)]/80 p-8 backdrop-blur-sm"
            style={{ gridTemplateColumns: `repeat(${gridCells.size || 12}, minmax(0, 1fr))`, width: 'max-content' }}
          >
            {gridCells.cells?.map((emp, i) => {
              if (!emp) {
                return <div key={`empty-${i}`} className="h-12 w-12 border border-dashed border-[var(--border-hairline)] transition-colors hover:bg-[var(--brand-soft)] md:h-16 md:w-16" />;
              }
              const isOnline = activeIds.has(emp.id);
              return (
                <div
                  key={emp.id}
                  title={`${emp.name} - ${emp.role}`}
                  className={`group relative flex h-12 w-12 cursor-crosshair flex-col items-center justify-center border transition-all duration-300 hover:z-20 hover:scale-110 md:h-16 md:w-16 ${isOnline ? 'border-[var(--emerald)] bg-[var(--emerald-soft)] shadow-[inset_0_0_10px_rgba(5,150,105,0.2)]' : 'border-[var(--border-hairline)] bg-[var(--bg-panel)]'}`}
                >
                  <div className="w-full truncate px-1 text-center text-[10px] font-bold uppercase tracking-tighter text-[var(--text-main)] md:text-xs">{emp.name.split(' ')[0]}</div>
                  <div className="w-full truncate px-1 text-center text-[8px] text-[var(--text-muted)]">{emp.department?.substring(0, 4) || 'CORE'}</div>
                  <div
                    className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: isOnline ? 'var(--emerald)' : 'transparent', border: isOnline ? 'none' : '1px solid var(--border-hairline)', boxShadow: isOnline ? '0 0 8px var(--emerald)' : 'none' }}
                  />
                  <div className="absolute left-1/2 top-full z-30 mt-2 hidden w-32 -translate-x-1/2 border border-[var(--brand)] bg-[var(--bg-panel)] p-2 text-center group-hover:block">
                    <p className="truncate text-[10px] font-bold uppercase text-[var(--brand)]">{emp.name}</p>
                    <p className="truncate text-[8px] text-[var(--text-muted)]">{emp.designation}</p>
                    <p className="mt-1 border-t border-[var(--border-hairline)] pt-1 text-[8px] text-[var(--text-muted)]">{emp.department || 'CORE'} · {isOnline ? 'ONLINE' : 'OFFLINE'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <EmptyState title="No assets match query" description="Try a different search term." icon={<Network className="h-6 w-6" />} />
          </div>
        )}
      </div>
    </div>
  );
}
