import React from 'react';
import { Cpu } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { getAssets } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { AssetsClient } from '@/components/assets/AssetsClient';

export const dynamic = 'force-dynamic';

function calculateDepreciation(asset: { purchasePrice: number; purchaseDate: Date; depreciationYears?: number }) {
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
  const assets = await getAssets();

  const totalAssets = assets.length;
  const totalValue = assets.reduce((acc: number, curr: { purchasePrice?: number }) => acc + (curr.purchasePrice || 0), 0);
  const currentFleetValue = assets.reduce(
    (acc: number, curr: { purchasePrice: number; purchaseDate: Date; depreciationYears?: number }) => acc + calculateDepreciation(curr),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <PageHeader
        title="IT Fleet"
        subtitle="Global hardware inventory & assignments."
        icon={<Cpu className="h-5 w-5" />}
      />

      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Fleet Size</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-main)]">{totalAssets}</p>
              <p className="text-sm text-[var(--text-muted)]">Units</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Original Value</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-main)]">
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Current Book Value</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--rose)]">
                ${currentFleetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <AssetsClient assets={assets} isAdmin={isAdmin} />
    </div>
  );
}
