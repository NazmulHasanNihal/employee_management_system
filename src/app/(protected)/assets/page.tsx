import React from 'react';
import { Cpu } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { getAssets } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { AssetsClient } from '@/components/assets/AssetsClient';
import { T } from "@/components/Translate";

export const dynamic = 'force-dynamic';

function calculateDepreciation(asset: { purchasePrice?: number | null; purchaseDate?: Date | string | null; depreciationYears?: number | null }) {
  if (!asset.purchasePrice || !asset.purchaseDate) return 0;
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const depPerYear = asset.purchasePrice / (asset.depreciationYears || 3);
  return Math.max(0, asset.purchasePrice - depPerYear * yearsElapsed);
}

export default async function AssetsPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;
  const isCEO = caller?.isCEO ?? false;
  const isHR = caller?.isHR ?? false;
  const privileged = isAdmin || isCEO || isHR;
  const assets = await getAssets();

  const totalAssets = assets.length;
  const totalValue = assets.reduce((acc: number, curr: { purchasePrice?: number | null }) => acc + (curr.purchasePrice || 0), 0);
  const currentFleetValue = assets.reduce(
    (acc: number, curr: any) => acc + calculateDepreciation(curr),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="IT Fleet & Office Assets"
        subtitle="Hardware inventory, device assignments & asset provisioning."
        icon={<Cpu className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Total Fleet Size</T></p>
             <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">{totalAssets}</p>
            <p className="text-sm text-[var(--text-muted)]">{/* @ts-ignore */}<T>Units</T></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Original Value</T></p>
             <p className="mt-2 text-fluid-3xl font-semibold text-[var(--text-main)]">
              ৳{Number(totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Current Book Value</T></p>
             <p className="mt-2 text-fluid-3xl font-semibold text-[var(--rose)]">
              ৳{Number(currentFleetValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <AssetsClient assets={assets} isAdmin={privileged} />
    </div>
  );
}
