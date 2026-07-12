"use client";

import React, { useMemo } from 'react';
import { Network, Search, Filter } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function GridPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  
  const { data: employees, isLoading } = trpc.registry.searchEmployees.useQuery({}, { enabled: !!user });

  // Generate deterministic grid positions based on string hashing
  const gridCells = useMemo(() => {
    if (!employees) return { size: 12, cells: [] };
    
    const size = 12; // 12x12 grid
    const cells = Array(size * size).fill(null);
    
    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs(hash);
    };

    employees.forEach((emp: any) => {
      // Find an empty cell starting from hash index
      let idx = getHash(emp.id) % (size * size);
      while (cells[idx] !== null) {
        idx = (idx + 1) % (size * size);
      }
      cells[idx] = emp;
    });
    
    return { size, cells };
  }, [employees]);

  if (isLoading || !user) {
    return <div className="p-8 text-center ledger-muted animate-pulse">Loading Spatial Data...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b ledger-border shrink-0">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text flex items-center gap-2">
            <Network size={24} className="text-[var(--ledger-blue)]" /> The Grid
          </h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">
            Spatial Presence & Telemetry
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-[var(--bg-void)] border ledger-border px-3 py-1">
            <Search size={12} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="LOCATE ASSET..." 
              className="bg-transparent border-none outline-none text-[10px] font-mono w-32 uppercase"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 ledger-panel p-6 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--border-hairline)_1px,_transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
        
        <div className="flex justify-end gap-4 mb-4 text-[9px] font-mono uppercase tracking-widest ledger-muted relative z-10 shrink-0">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--verify-green)] rounded-full animate-pulse shadow-[0_0_8px_var(--verify-green)]"></span> Online</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--signal-amber)] rounded-full"></span> Away</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--bg-void)] border border-[var(--border-hairline)] rounded-full"></span> Offline</span>
        </div>

        <div className="flex-1 w-full flex items-center justify-center overflow-auto custom-scrollbar relative z-10 p-4">
          <div 
            className="grid gap-2 p-8 border border-[var(--ledger-blue)]/20 shadow-[0_0_30px_rgba(0,195,255,0.05)] bg-[var(--bg-void)]/80 backdrop-blur-sm"
            style={{ 
              gridTemplateColumns: `repeat(${gridCells.size || 12}, minmax(0, 1fr))`,
              width: 'max-content'
            }}
          >
            {gridCells.cells?.map((emp, i) => {
              if (!emp) {
                return (
                  <div key={`empty-${i}`} className="w-12 h-12 md:w-16 md:h-16 border border-[var(--border-hairline)] border-dashed bg-transparent transition-colors hover:bg-[var(--ledger-blue)]/5"></div>
                );
              }

              // Mock status logic based on char code to keep it deterministic but varied
              const statusHash = emp.name.charCodeAt(0) % 3; 
              const statusColor = statusHash === 0 ? 'var(--verify-green)' : statusHash === 1 ? 'var(--signal-amber)' : 'transparent';
              const isOnline = statusHash === 0;

              return (
                <div 
                  key={emp.id} 
                  title={`${emp.name} - ${emp.role}`}
                  className={`w-12 h-12 md:w-16 md:h-16 border flex flex-col items-center justify-center relative cursor-crosshair group transition-all duration-300 hover:scale-110 hover:z-20 ${isOnline ? 'border-[var(--verify-green)] bg-[var(--verify-green)]/10 shadow-[inset_0_0_10px_rgba(0,255,128,0.2)]' : 'border-[var(--ledger-border)] bg-[var(--bg-panel)]'}`}
                >
                  <div className="text-[10px] md:text-xs font-bold font-mono text-[var(--text-main)] uppercase tracking-tighter truncate w-full text-center px-1">
                    {emp.name.split(' ')[0]}
                  </div>
                  <div className="text-[8px] font-mono ledger-muted truncate w-full text-center px-1">
                    {emp.department?.substring(0, 4) || 'CORE'}
                  </div>
                  
                  {/* Status Indicator */}
                  <div 
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: statusColor, boxShadow: isOnline ? `0 0 8px ${statusColor}` : 'none' }}
                  ></div>

                  {/* Hover Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-[var(--bg-void)] border border-[var(--ledger-blue)] shadow-xl hidden group-hover:block z-30 w-32 pointer-events-none">
                    <p className="text-[10px] font-bold text-[var(--ledger-blue)] uppercase truncate">{emp.name}</p>
                    <p className="text-[8px] font-mono text-[var(--text-muted)] truncate">{emp.designation}</p>
                    <p className="text-[8px] font-mono text-[var(--text-muted)] truncate mt-1 border-t border-[var(--border-hairline)] pt-1">
                      LOC: SEC-{(i % 12) + 1}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
