import React, { useMemo } from 'react';

export function SprintHeatmap() {
  const heatmapData = useMemo(() => {
    return Array.from({ length: 364 }, (_, i) => Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0);
  }, []);

  return (
    <div className="ledger-panel p-6 shadow-sm flex flex-col mt-6">
      <h3 className="font-mono text-xs uppercase text-[var(--text-muted)] mb-4">Sprint Activity Hashrate (Commits / Resolutions)</h3>
      <div className="flex-1 w-full overflow-x-auto custom-scrollbar">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {heatmapData.map((val: number, idx: number) => {
            let color = 'bg-[var(--bg-void)] border border-[var(--border-hairline)]';
            if (val === 1) color = 'bg-[var(--verify-green)]/30';
            if (val === 2) color = 'bg-[var(--verify-green)]/60';
            if (val === 3) color = 'bg-[var(--verify-green)]/90';
            if (val >= 4) color = 'bg-[var(--verify-green)] shadow-[0_0_5px_var(--verify-green)]';
            
            return (
              <div 
                key={idx} 
                title={`Day ${idx + 1}: ${val} operations`}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${color} transition-colors hover:border-[var(--ledger-blue)]`}
              ></div>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-[var(--text-muted)] mt-2 w-max min-w-full">
          <span>52 WEEKS AGO</span>
          <div className="flex items-center gap-2">
            <span>LESS</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-[var(--bg-void)] border border-[var(--border-hairline)]"></div>
              <div className="w-3 h-3 bg-[var(--verify-green)]/30"></div>
              <div className="w-3 h-3 bg-[var(--verify-green)]/60"></div>
              <div className="w-3 h-3 bg-[var(--verify-green)]"></div>
            </div>
            <span>MORE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
