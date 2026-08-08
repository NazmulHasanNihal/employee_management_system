"use client";

import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, BarChart3, Users, DollarSign, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BiasChart from './BiasChartDynamic';
import { formatCurrency } from '@/lib/format';
import { T } from "@/components/Translate";

type AnalysisGroup = { group: string; headcount: number; avgSalary: number; deviation: number; biasFlag: boolean };
type Dimension = { name: string; analysis: AnalysisGroup[] };

export default function BiasScannerClient({
  initialDimensions,
  globalAvg,
}: {
  initialDimensions: Dimension[];
  globalAvg: number;
}) {
  const [activeDimension, setActiveDimension] = useState<string>(initialDimensions[0]?.name || 'Department');
  const [threshold, setThreshold] = useState(20);

  const currentDimension = initialDimensions.find(d => d.name === activeDimension);
  
  // Re-compute bias flags on the client based on the current threshold slider
  const analysisData = useMemo(() => {
    if (!currentDimension) return [];
    return currentDimension.analysis.map(group => ({
      ...group,
      biasFlag: Math.abs(group.deviation) > threshold
    }));
  }, [currentDimension, threshold]);

  const totalFlags = analysisData.filter((a) => a.biasFlag).length;

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-panel)] p-4 rounded-2xl border border-[var(--border-hairline)] shadow-sm">
        <div className="flex flex-wrap gap-2">
          {initialDimensions.map(dim => (
            <button
              key={dim.name}
              onClick={() => setActiveDimension(dim.name)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeDimension === dim.name 
                  ? 'bg-[var(--brand-strong)] text-white shadow-md'
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {/* @ts-ignore */}
              <T>{dim.name}</T>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Settings2 size={16} className="text-[var(--text-muted)]" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              {/* @ts-ignore */}
              <T>Bias Threshold:</T> {threshold}%
            </span>
            <input 
              type="range" 
              min="5" 
              max="50" 
              step="5" 
              value={threshold} 
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="accent-[var(--brand-strong)]"
            />
          </div>
        </div>
      </div>

      <div className={`flex flex-col items-center justify-between gap-6 rounded-3xl border p-8 shadow-2xl md:flex-row ${totalFlags === 0 ? 'border-[var(--emerald)]/30 bg-[var(--emerald-soft)]' : 'border-[var(--rose)]/30 bg-[var(--rose-soft)]'}`}>
        <div className="flex items-center gap-6">
          {totalFlags === 0 ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--emerald)]/50 bg-[var(--emerald-soft)]">
              <CheckCircle2 className="text-[var(--emerald)]" size={40} />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--rose)]/50 bg-[var(--rose-soft)]">
              <AlertCircle className="animate-pulse text-[var(--rose)]" size={40} />
            </div>
          )}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Audit Status:</T> {activeDimension}</p>
            {totalFlags === 0 ? (
               <h3 className="text-fluid-3xl font-extrabold text-[var(--text-main)]">{/* @ts-ignore */}<T>No Systemic Bias Detected</T></h3>
            ) : (
               <h3 className="text-fluid-3xl font-extrabold text-[var(--text-main)]">{totalFlags} {/* @ts-ignore */}<T>Discrepancy Flags Found</T></h3>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 text-center md:text-right">
          <p className="mb-1 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] md:justify-end">
            <DollarSign size={12} /> {/* @ts-ignore */}<T>Global Base Salary Average</T></p>
          <p className="text-fluid-3xl font-bold tracking-tight text-[var(--text-main)]">
            {formatCurrency(globalAvg, 'BDT', 'en')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-2">
        <BarChart3 size={16} className="text-[var(--brand-strong)]" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">{/* @ts-ignore */}<T>Demographic Breakdown</T></h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {analysisData.map((group) => (
          <Card key={group.group} className={group.biasFlag ? 'border-[var(--rose)]/40' : ''}>
            <CardContent>
              <div className="mb-8 flex items-start justify-between">
                <div>
                   <h3 className="mb-2 text-fluid-2xl font-extrabold text-[var(--text-main)]">{group.group}</h3>
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-3 py-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] w-fit">
                    <Users size={12} /> {/* @ts-ignore */}<T>Headcount:</T>{group.headcount}
                  </div>
                </div>
                {group.biasFlag ? (
                  <Badge variant="rose" className="animate-pulse"><AlertCircle size={14} /> {/* @ts-ignore */}<T>Flagged</T></Badge>
                ) : (
                  <Badge variant="emerald"><CheckCircle2 size={14} /> {/* @ts-ignore */}<T>Clear</T></Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-5">
                  <p className="mb-2 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Group Average</T></p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xl font-bold ${group.biasFlag ? 'text-[var(--rose)]' : 'text-[var(--text-main)]'}`}>
                      {formatCurrency(Math.round(group.avgSalary), 'BDT', 'en')}
                    </p>
                    {group.avgSalary > globalAvg ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)]">
                        <TrendingUp size={12} />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rose-soft)] text-[var(--rose)]">
                        <TrendingDown size={12} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-5">
                  <p className="mb-2 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Deviation</T></p>
                  <p className="text-xl font-bold text-[var(--text-main)]">
                    {group.deviation.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analysisData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Salary Distribution</T> - {activeDimension}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BiasChart analysis={analysisData} globalAvg={globalAvg} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
