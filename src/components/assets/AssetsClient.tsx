'use client';

import React, { useState } from 'react';
import { Laptop, Monitor, Cpu, Keyboard, Plus, UserCheck, UserMinus, Clock, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, X, Eye, Box, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

interface AssetsClientProps {
  assets: any[];
  isAdmin: boolean;
}

function getIcon(name: string) {
  const l = (name || '').toLowerCase();
  if (l.includes('macbook') || l.includes('laptop') || l.includes('thinkpad')) return <Laptop className="h-7 w-7" />;
  if (l.includes('monitor') || l.includes('display')) return <Monitor className="h-7 w-7" />;
  if (l.includes('keyboard') || l.includes('mouse') || l.includes('keychron')) return <Keyboard className="h-7 w-7" />;
  return <Cpu className="h-7 w-7" />;
}

function calculateDepreciation(asset: any): { current: number | null } {
  if (!asset.purchasePrice || !asset.purchaseDate) return { current: null };
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const depPerYear = asset.purchasePrice / (asset.depreciationYears || 3);
  const currentValue = Math.max(0, asset.purchasePrice - depPerYear * yearsElapsed);
  return { current: Number(currentValue.toFixed(2)) };
}

function getAssignmentDuration(assignedDateStr?: string | Date): string {
  if (!assignedDateStr) return 'Recently assigned';
  const start = new Date(assignedDateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Assigned today';
  if (days === 1) return 'Assigned 1 day ago';
  return `Assigned for ${days} days`;
}

export function AssetsClient({ assets, isAdmin }: AssetsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [inspectingAsset, setInspectingAsset] = useState<any | null>(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'Laptop',
    brand: '',
    serialNumber: '',
    assetTag: '',
    condition: 'Good',
    location: 'Dhaka HQ',
    status: 'Active',
    userId: '',
    purchasePrice: 0,
    purchaseDate: '',
    notes: '',
  });

  const utils = trpc.useUtils();
  const { data: assetsData } = trpc.assets.getAssets.useQuery(undefined, { initialData: assets as any });
  const assetsList = (assetsData as any[] | undefined) ?? assets ?? [];
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: isAdmin || Boolean(inspectingAsset) });

  const createMutation = trpc.assets.createAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAssets.invalidate();
      setShowCreate(false);
      setNewAsset({
        name: '',
        category: 'Laptop',
        brand: '',
        serialNumber: '',
        assetTag: '',
        condition: 'Good',
        location: 'Dhaka HQ',
        status: 'Active',
        userId: '',
        purchasePrice: 0,
        purchaseDate: '',
        notes: '',
      });
      toast.success('Asset Provisioned', 'Hardware asset registered in office inventory.');
    },
    onError: (err: any) => toast.error('Provisioning Error', err?.message),
  });

  const updateMutation = trpc.assets.updateAsset.useMutation({
    onSuccess: () => {
      utils.assets.getAssets.invalidate();
      if (inspectingAsset) {
        setInspectingAsset(null);
      }
      toast.success('Asset Updated', 'Asset assignment & status saved.');
    },
    onError: (err: any) => toast.error('Update Error', err?.message),
  });

  const totalCount = assetsList.length;
  const assignedCount = assetsList.filter((a: any) => a.userId || a.user?.id).length;
  const unassignedCount = totalCount - assignedCount;

  const filteredAssets = assetsList.filter(
    (a: any) =>
      (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Inventory Quantity Summary Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Office Fleet</p>
              <p className="text-3xl font-extrabold text-[var(--text-main)] font-mono">{totalCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
              <Box size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--emerald)]">Assigned to Staff</p>
              <p className="text-3xl font-extrabold text-[var(--text-main)] font-mono">{assignedCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--emerald)]/20 text-[var(--emerald)]">
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--amber)]">Unassigned In Stock</p>
              <p className="text-3xl font-extrabold text-[var(--text-main)] font-mono">{unassignedCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--amber)]/20 text-[var(--amber)]">
              <UserMinus size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search assets by device name, employee, serial no, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? 'Cancel' : <><Plus className="h-4 w-4 mr-1" /> {/* @ts-ignore */}<T>Add New Asset</T></>}
          </Button>
        )}
      </div>

      {showCreate && isAdmin && (
        <Card className="animate-scale-in border-[var(--brand)]/40 shadow-2xl rounded-3xl bg-[var(--bg-panel)]">
          <CardHeader className="border-b border-[var(--border-hairline)] pb-3 mb-2">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold">
              <Plus className="h-5 w-5 text-[var(--brand)]" />
              {/* @ts-ignore */}<T>Register & Provision New Office Asset</T>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Asset / Device Name *</T></label>
                <Input
                  placeholder="e.g. MacBook Pro M3 Max 16-inch"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Category</T></label>
                <select
                  className="flex h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  value={newAsset.category}
                  onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                >
                  <option value="Laptop">Laptop / Notebook</option>
                  <option value="Desktop">Desktop Workstation</option>
                  <option value="Monitor">Monitor & Display</option>
                  <option value="Peripheral">Peripheral (Keyboard, Mouse, Audio)</option>
                  <option value="Mobile Device">Mobile Device / Tablet</option>
                  <option value="Network & Server">Network & Server Gear</option>
                  <option value="Other">Other Office Asset</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Brand / Manufacturer</T></label>
                <Input
                  placeholder="e.g. Apple, Dell, Lenovo, Keychron"
                  value={newAsset.brand}
                  onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Serial Number</T></label>
                <Input
                  placeholder="e.g. C02FX901MD6R"
                  value={newAsset.serialNumber}
                  onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Custom Asset Tag / Ref</T></label>
                <Input
                  placeholder="Auto-generated if empty (AST-2026-XXXX)"
                  value={newAsset.assetTag}
                  onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Condition</T></label>
                <select
                  className="flex h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  value={newAsset.condition}
                  onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Good">Good Condition</option>
                  <option value="Fair">Fair Condition</option>
                  <option value="Needs Repair">Needs Repair / Maintenance</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Office Location</T></label>
                <select
                  className="flex h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  value={newAsset.location}
                  onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                >
                  <option value="Dhaka HQ">Dhaka HQ Office</option>
                  <option value="Chittagong Office">Chittagong Branch</option>
                  <option value="Remote">Remote Personnel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Purchase Price (৳ BDT)</T></label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="2500.00"
                  value={newAsset.purchasePrice || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Purchase Date</T></label>
                <Input
                  type="date"
                  value={newAsset.purchaseDate}
                  onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Assign To Employee</T></label>
                <select
                  className="flex h-10 w-full cursor-pointer rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  value={newAsset.userId}
                  onChange={(e) => setNewAsset({ ...newAsset, userId: e.target.value })}
                >
                  <option value="">{/* @ts-ignore */}<T>— Unassigned (Inventory Stock) —</T></option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Asset Notes &amp; Specifications</T></label>
              <Input
                placeholder="Optional specs, warranty details, or hardware notes..."
                value={newAsset.notes}
                onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={createMutation.isPending || !newAsset.name}
                onClick={() =>
                  createMutation.mutate({
                    name: newAsset.name,
                    category: newAsset.category,
                    brand: newAsset.brand || undefined,
                    serialNumber: newAsset.serialNumber || undefined,
                    assetTag: newAsset.assetTag || undefined,
                    condition: newAsset.condition,
                    location: newAsset.location,
                    status: newAsset.status,
                    notes: newAsset.notes || undefined,
                    userId: newAsset.userId || undefined,
                    purchasePrice: newAsset.purchasePrice,
                    purchaseDate: newAsset.purchaseDate ? new Date(newAsset.purchaseDate) : undefined,
                  })
                }
              >
                {createMutation.isPending ? 'Saving Asset…' : 'Save & Provision Asset'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredAssets.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)] p-12 text-center">
          <Laptop className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text-muted)]">{/* @ts-ignore */}<T>No Hardware Assets Found</T></h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset: any) => {
            const dep = calculateDepreciation(asset);
            const statusVariant =
              asset.status === 'Active' ? 'emerald' : asset.status === 'Maintenance' ? 'amber' : 'rose';
            const isAssigned = Boolean(asset.user?.name || asset.userId);

            return (
              <Card key={asset.id} className="group relative overflow-hidden transition-all hover:border-[var(--brand)]/50 hover:shadow-xl">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      {getIcon(asset.name)}
                    </div>
                    <Badge variant={statusVariant as any}>{asset.status}</Badge>
                  </div>

                  <div>
                    {/* Clickable Device Name opens inspection modal */}
                    <button
                      onClick={() => setInspectingAsset(asset)}
                      className="group/title flex items-center gap-1.5 text-left font-bold text-lg text-[var(--text-main)] hover:text-[var(--brand)] transition-colors"
                    >
                      <span className="truncate">{asset.name}</span>
                      <Eye size={16} className="shrink-0 text-[var(--brand)] opacity-0 group-hover/title:opacity-100 transition-opacity" />
                    </button>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Click device name to inspect details</p>
                  </div>

                  <div className={`rounded-2xl p-3.5 border ${isAssigned ? 'border-[var(--emerald)]/20 bg-[var(--emerald-soft)]' : 'border-[var(--amber)]/20 bg-[var(--amber-soft)]'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Assigned Personnel</p>
                    <div className="mt-1 flex items-center gap-2">
                      {asset.user?.avatarUrl && <Avatar src={asset.user.avatarUrl} name={asset.user.name} size="sm" />}
                      <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                        {asset.user?.name || <span className="italic text-[var(--amber)]">Unassigned (In Stock)</span>}
                      </p>
                    </div>
                    {isAssigned && (
                      <p className="mt-1 text-[10px] font-medium text-[var(--emerald)]">
                        {getAssignmentDuration(asset.createdAt)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase text-[var(--text-muted)]">Acquired</p>
                      <p className="font-semibold text-[var(--text-main)]">
                        {asset.purchaseDate ? formatDate(asset.purchaseDate, 'en') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--text-muted)]">Book Value</p>
                      <p className={`font-semibold ${dep.current === 0 ? 'text-[var(--rose)]' : 'text-[var(--text-main)]'}`}>
                        {dep.current === null ? 'N/A' : `৳${dep.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectingAsset(asset)}
                        className="text-xs"
                      >
                        <Eye size={14} className="mr-1" /> Inspect &amp; Reassign
                      </Button>
                      <select
                        className="flex h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        value={asset.status}
                        onChange={(e) => updateMutation.mutate({ id: asset.id, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Asset Detailed Inspection Modal */}
      {inspectingAsset && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setInspectingAsset(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto my-auto rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4 sm:p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                  {getIcon(inspectingAsset.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">{inspectingAsset.name}</h3>
                  <Badge variant={inspectingAsset.status === 'Active' ? 'emerald' : 'amber'}>{inspectingAsset.status}</Badge>
                </div>
              </div>
              <button onClick={() => setInspectingAsset(null)} className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
                <X size={18} />
              </button>
            </div>

            {/* Currently Assigned Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Current Assignment Details</h4>
              {inspectingAsset.user?.name ? (
                <div className="flex items-center gap-4 rounded-2xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] p-4">
                  <Avatar src={inspectingAsset.user.avatarUrl} name={inspectingAsset.user.name} size="lg" />
                  <div>
                    <p className="text-base font-bold text-[var(--text-main)]">{inspectingAsset.user.name}</p>
                    <p className="text-xs text-[var(--emerald)] font-semibold">{inspectingAsset.user.designation || inspectingAsset.user.role || 'Staff'}</p>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={12} /> {getAssignmentDuration(inspectingAsset.createdAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] p-4 text-center">
                  <p className="text-sm font-bold text-[var(--amber)]">Unassigned (Available in Stock)</p>
                  <p className="text-xs text-[var(--amber)]/80 mt-0.5">Ready for provisioning to staff</p>
                </div>
              )}
            </div>

            {/* Reassign / Unassign Actions for Admin */}
            {isAdmin && (
              <div className="space-y-3 border-t border-[var(--border-hairline)] pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Reassign Asset to Personnel</label>
                <div className="flex gap-2">
                  <select
                    className="flex h-10 flex-1 cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={inspectingAsset.userId || ''}
                    onChange={(e) => {
                      const newUid = e.target.value;
                      updateMutation.mutate({
                        id: inspectingAsset.id,
                        userId: newUid || null,
                      });
                    }}
                  >
                    <option value="">— Unassign (Return to Inventory) —</option>
                    {users?.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} - {u.designation || u.role}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setInspectingAsset(null)}>Close Inspection</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
