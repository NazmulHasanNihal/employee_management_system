import React from 'react';
import { T } from "@/components/Translate";

interface SprintHeatmapProps {
  /** Real activity intensity per day (0-4) for the last 364 days. */
  data?: number[];
}

export function SprintHeatmap({ data }: SprintHeatmapProps) {
  const heatmapData = data && data.length === 364 ? data : Array<number>(364).fill(0);
  const totalActive = heatmapData.filter((v) => v > 0).length;

  return (
    <div className="flex flex-col">
      <h3 className="mb-1 text-sm font-semibold text-[var(--text-main)]">{/* @ts-ignore */}<T>Activity Heatmap</T></h3>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        {totalActive} {/* @ts-ignore */}<T>active</T>{totalActive === 1 ? 'day' : 'days'} {/* @ts-ignore */}<T>in the last 52 weeks</T></p>
      <div className="flex-1 w-full overflow-x-auto custom-scrollbar">
        <div className="grid grid-flow-col grid-rows-7 w-max gap-1">
          {heatmapData.map((val: number, idx: number) => {
            let color = 'bg-[var(--bg-hover)] border border-[var(--border-hairline)]';
            if (val === 1) color = 'bg-[var(--emerald)]/30';
            if (val === 2) color = 'bg-[var(--emerald)]/60';
            if (val === 3) color = 'bg-[var(--emerald)]/90';
            if (val >= 4) color = 'bg-[var(--emerald)] shadow-[0_0_5px_var(--emerald)]';

            return (
              <div
                key={idx}
                title={`Day ${idx + 1}: ${val} operations`}
                className={`h-3 w-3 rounded-sm transition-colors hover:border-[var(--brand)] md:h-4 md:w-4 ${color}`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex w-max min-w-full items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>{/* @ts-ignore */}<T>52 WEEKS AGO</T></span>
          <div className="flex items-center gap-2">
            <span>{/* @ts-ignore */}<T>LESS</T></span>
            <div className="flex gap-1">
              <div className="h-3 w-3 border border-[var(--border-hairline)] bg-[var(--bg-hover)]" />
              <div className="h-3 w-3 bg-[var(--emerald)]/30" />
              <div className="h-3 w-3 bg-[var(--emerald)]/60" />
              <div className="h-3 w-3 bg-[var(--emerald)]" />
            </div>
            <span>{/* @ts-ignore */}<T>MORE</T></span>
          </div>
        </div>
      </div>
    </div>
  );
}
