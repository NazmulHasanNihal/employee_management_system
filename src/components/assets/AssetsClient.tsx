'use client';

import React, { useState } from 'react';
import { Laptop, Monitor, Cpu, Keyboard, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { T } from "@/components/Translate";

interface AssetsClientProps {
  assets: any[];
  isAdmin: boolean;
}

function getIcon(name: string) {
  const l = (name || '').toLowerCase();
  if (l.includes('macbook') || l.includes('laptop') || l.includes('thinkpad')) return <Laptop className="h-8 w-8" />;
  if (l.includes('monitor') || l.includes('display')) return <Monitor className="h-8 w-8" />;
  if (l.includes('keyboard') || l.includes('mouse') || l.includes('keychron')) return <Keyboard className="h-8 w-8" />;
  return <Cpu className="h-8 w-8" />;
}

function calculateDepreciation(asset: any): { current: number | null } {
  // `null` signals "no book value available" (missing price/date) so the UI can
  // render a clean N/A instead of a misleading $0.00.
  if (!asset.purchasePrice || !asset.purchaseDate) return { current: null };
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const depPerYear = asset.purchasePrice / (asset.depreciationYears || 3);
  const currentValue = Math.max(0, asset.purchasePrice - depPerYear * yearsElapsed);
  return { current: Number(currentValue.toFixed(2)) };
}

export function AssetsClient({ assets, isAdmin }: AssetsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', status: 'Active', userId: '', purchasePrice: 0, purchaseDate: '' });

  const utils = trpc.useUtils();
  // Live list (seeded with server prop) so create/update refreshes in place.
  const { data: assetsData } = trpc.assets.getAssets.useQuery(undefined, { initialData: assets as any });
  const assetsList = (assetsData as any[] | undefined) ?? assets ?? [];
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin });

  const createMutation = trpc.assets.createAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAssets.invalidate();
      setShowCreate(false);
      setNewAsset({ name: '', status: 'Active', userId: '', purchasePrice: 0, purchaseDate: '' });
    },
  });

  const updateMutation = trpc.assets.updateAsset.useMutation({
    onSuccess: () => utils.assets.getAssets.invalidate(),
  });

  const filteredAssets = assetsList.filter(
    (a: any) =>
      (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search fleet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? 'Cancel' : <><Plus className="h-4 w-4" /> {/* @ts-ignore */}<T>Provision Asset</T></>}
          </Button>
        )}
      </div>

      {showCreate && isAdmin && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>{/* @ts-ignore */}<T>Provision Hardware</T></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Device Name / Model</T></label>
                <Input
                  placeholder="e.g. MacBook Pro M3 Max"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Purchase Price ($)</T></label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="2500.00"
                  onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Purchase Date</T></label>
                <Input
                  type="date"
                  onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{/* @ts-ignore */}<T>Assign To</T></label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newAsset.userId}
                  onChange={(e) => setNewAsset({ ...newAsset, userId: e.target.value })}
                >
                  <option value="">{/* @ts-ignore */}<T>Unassigned (Inventory)</T></option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={createMutation.isPending || !newAsset.name}
                  onClick={() =>
                    createMutation.mutate({
                      name: newAsset.name,
                      status: newAsset.status,
                      userId: newAsset.userId || undefined,
                      purchasePrice: newAsset.purchasePrice,
                      purchaseDate: newAsset.purchaseDate ? new Date(newAsset.purchaseDate) : undefined,
                    })
                  }
                >
                  {/* @ts-ignore */}<T>Execute Provisioning</T></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredAssets.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
          <Laptop className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text-muted)]">{/* @ts-ignore */}<T>No Hardware Assets Found</T></h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset: any) => {
            const dep = calculateDepreciation(asset);
            const statusVariant =
              asset.status === 'Active' ? 'emerald' : asset.status === 'Maintenance' ? 'amber' : 'rose';
            return (
              <Card key={asset.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      {getIcon(asset.name)}
                    </div>
                    <Badge variant={statusVariant as any}>{asset.status}</Badge>
                  </div>

                   <h4 className="truncate text-lg font-semibold text-[var(--text-main)]">{asset.name}</h4>

                   <div className="rounded-2xl bg-[var(--bg-hover)] p-4">
                     <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Assigned Personnel</T></p>
                     <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                       {asset.user?.name || <span className="italic text-[var(--amber)]">{/* @ts-ignore */}<T>Unassigned (Inventory)</T></span>}
                     </p>
                   </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Acquired</T></p>
                      <p className="text-xs text-[var(--text-main)]">
                        {asset.purchaseDate ? formatDate(asset.purchaseDate, 'en') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Book Value</T></p>
                      <p className={`text-sm font-semibold ${dep.current === 0 ? 'text-[var(--rose)]' : 'text-[var(--text-main)]'}`}>
                        {dep.current === null ? 'N/A' : `$${dep.current.toFixed(2)}`}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end border-t border-[var(--border-hairline)] pt-4">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-auto py-1.5 text-xs"
                        value={asset.status}
                        onChange={(e) => updateMutation.mutate({ id: asset.id, status: e.target.value })}
                      >
                        <option value="Active">{/* @ts-ignore */}<T>Active</T></option>
                        <option value="Maintenance">{/* @ts-ignore */}<T>Maintenance</T></option>
                        <option value="Retired">{/* @ts-ignore */}<T>Retired</T></option>
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
