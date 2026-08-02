'use client';

import React, { useState } from 'react';
import { Wallet, TrendingUp, Smartphone, Landmark, CheckCircle2, AlertCircle, CreditCard, Trash2, ShieldCheck, Building, Info, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

interface PaymentHubProps {
  isAdmin: boolean;
  latestPayslip: any | null;
  salesThisMonth: number;
  salesLastMonth: number;
  payments: any[];
  month: number;
  year: number;
  userId: string;
}

const INITIAL_FUND_BALANCE = 1000000; // 10 Lakh BDT

const MFS_METHODS: Record<string, { label: string; tone: string; account: string; type: string }> = {
  BKASH: { label: 'bKash', tone: 'text-[#e2136e] bg-[#fde9f2] border-[#e2136e]/30', account: '+8801700000000 (Merchant)', type: 'MFS Wallet' },
  NAGAD: { label: 'Nagad', tone: 'text-[#f37023] bg-[#fef2e8] border-[#f37023]/30', account: '+8801800000000 (Merchant)', type: 'MFS Wallet' },
  ROCKET: { label: 'Rocket', tone: 'text-[#7b2bf9] bg-[#f1e9fe] border-[#7b2bf9]/30', account: '+8801900000000-8 (DBBL MFS)', type: 'MFS Wallet' },
  UPAY: { label: 'Upay', tone: 'text-[#0072ce] bg-[#e6f2fc] border-[#0072ce]/30', account: '+8801600000000 (UCB MFS)', type: 'MFS Wallet' },
  CELLFIN: { label: 'CellFin', tone: 'text-[#008080] bg-[#e6f2f2] border-[#008080]/30', account: 'Islami Bank Smart Wallet', type: 'Bank App MFS' },
};

const BANK_OPTIONS = [
  { name: 'Dutch-Bangla Bank PLC (DBBL)', routing: '090262100', code: 'DBBL' },
  { name: 'BRAC Bank PLC', routing: '060261100', code: 'BRAC' },
  { name: 'The City Bank PLC', routing: '085261500', code: 'CITY' },
  { name: 'Eastern Bank PLC (EBL)', routing: '095261200', code: 'EBL' },
  { name: 'Islami Bank Bangladesh PLC (IBBL)', routing: '125261800', code: 'IBBL' },
  { name: 'Sonali Bank PLC (State-Owned)', routing: '200260100', code: 'SONALI' },
  { name: 'Standard Chartered Bangladesh', routing: '215260500', code: 'SCB' },
  { name: 'Prime Bank PLC', routing: '170261900', code: 'PRIME' },
];

export function PaymentHub({ isAdmin, latestPayslip, salesThisMonth, salesLastMonth, payments, month, year, userId }: PaymentHubProps) {
  const [methodCategory, setMethodCategory] = useState<'MFS' | 'BANK'>('MFS');
  const [selectedMfs, setSelectedMfs] = useState<string>('BKASH');
  const [selectedBank, setSelectedBank] = useState<string>('Dutch-Bangla Bank PLC (DBBL)');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [branchName, setBranchName] = useState('Gulshan Main Branch');
  const [routingNumber, setRoutingNumber] = useState('090262100');
  const [accountHolder, setAccountHolder] = useState('');

  const utils = trpc.useUtils();
  const { data: paymentData } = trpc.payroll.getPayments.useQuery(undefined, { initialData: payments as any });
  const livePayments = (paymentData as any[] | undefined) ?? payments;

  const amountDue = latestPayslip?.netPay ?? latestPayslip?.totalAmount ?? 0;
  const relatedPayment = livePayments.find((p) => p.payrollId === latestPayslip?.id) || null;
  const isPaid = relatedPayment?.status === 'PAID';

  const totalPaidOut = livePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const fundBalance = Math.max(0, INITIAL_FUND_BALANCE - totalPaidOut);

  const recordPayment = trpc.payroll.recordPayment.useMutation({
    onSuccess: () => {
      utils.payroll.getPayments.invalidate();
      setReference('');
      setAmount('');
      toast.success('Payment Recorded', 'Disbursement executed successfully.');
    },
    onError: (err: any) => {
      toast.error('Payment Error', err?.message || 'Failed to record payment');
    },
  });

  const deletePayment = trpc.payroll.deletePayment.useMutation({
    onSuccess: () => {
      utils.payroll.getPayments.invalidate();
      toast.success('Payment Record Removed', 'The payment entry has been deleted.');
    },
    onError: (err: any) => {
      toast.error('Delete Failed', err?.message || 'Failed to remove payment record.');
    },
  });

  const payNow = () => {
    const payAmount = Number(amount) || amountDue || 1000;
    const finalMethod = methodCategory === 'MFS' ? selectedMfs : 'BANK';
    
    let extraDetails = '';
    if (methodCategory === 'BANK') {
      extraDetails = ` - ${selectedBank} (Branch: ${branchName}, Routing: ${routingNumber})`;
    } else {
      extraDetails = ` - ${MFS_METHODS[selectedMfs]?.label || selectedMfs}`;
    }

    recordPayment.mutate({
      userId,
      payrollId: latestPayslip?.id || null,
      month,
      year,
      amount: payAmount,
      method: finalMethod,
      reference: reference || 'TXN-BD-' + Math.floor(100000 + Math.random() * 900000),
      status: 'PAID',
      details: isAdmin ? `Manual Disbursement (Admin)${extraDetails}` : `Paid via ${finalMethod}${extraDetails}`,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Account Balance & Sales Card */}
      <Card className="lg:col-span-1 space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet size={16} className="text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Disbursement Account &amp; Sales</T>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--emerald)]">{/* @ts-ignore */}<T>Real Payroll Fund Balance</T></p>
            <p className="text-2xl font-extrabold text-[var(--text-main)] font-mono">{formatCurrency(fundBalance, 'BDT', 'en')}</p>
            <p className="mt-1 text-[10px] text-[var(--emerald)]/80">Active liquid balance for employee payouts</p>
          </div>

          <div className="rounded-2xl bg-[var(--brand-soft)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--brand-strong)]">{/* @ts-ignore */}<T>This Month Sales</T></p>
            <p className="text-xl font-bold text-[var(--text-main)]">{formatCurrency(salesThisMonth, 'BDT', 'en')}</p>
          </div>

          <div className="rounded-2xl bg-[var(--bg-hover)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Last Month Sales</T></p>
            <p className="text-xl font-bold text-[var(--text-main)]">{formatCurrency(salesLastMonth, 'BDT', 'en')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway & Disbursement Options */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[var(--brand-strong)]" /> {/* @ts-ignore */}<T>Payment Hub &amp; Payout Options</T>
            </div>
            <Badge variant={amountDue > 0 && !isPaid ? 'amber' : 'emerald'}>
              {amountDue > 0 && !isPaid ? `Balance Due: ৳${amountDue.toLocaleString()}` : `Balance ৳0.00`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Method Category Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Select Payment Channel</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethodCategory('MFS')}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-bold transition-all ${
                  methodCategory === 'MFS'
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)] shadow-sm'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Smartphone className="h-4 w-4" /> Bangladeshi MFS Wallets
              </button>
              <button
                type="button"
                onClick={() => setMethodCategory('BANK')}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-bold transition-all ${
                  methodCategory === 'BANK'
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)] shadow-sm'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Landmark className="h-4 w-4" /> Bangladeshi Banks (EFT / BEFTN)
              </button>
            </div>
          </div>

          {/* MFS Selection */}
          {methodCategory === 'MFS' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-[var(--text-muted)]">Select MFS Provider</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.keys(MFS_METHODS).map((mKey) => {
                  const info = MFS_METHODS[mKey];
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => setSelectedMfs(mKey)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-xs font-bold transition-all ${
                        selectedMfs === mKey
                          ? `${info.tone} ring-2 ring-[var(--brand)]/30`
                          : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <Smartphone className="h-4 w-4 mb-1" />
                      {info.label}
                    </button>
                  );
                })}
              </div>

              {/* MFS Information Box */}
              <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 flex items-start gap-3 text-xs text-[var(--text-main)]">
                <Info className="h-4 w-4 shrink-0 text-[var(--brand-strong)] mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[var(--brand-strong)]">{MFS_METHODS[selectedMfs]?.label} Merchant Account</p>
                  <p className="text-[var(--text-muted)]">Merchant Number: <span className="font-mono font-bold text-[var(--text-main)]">{MFS_METHODS[selectedMfs]?.account}</span></p>
                  <p className="text-[var(--text-muted)] mt-0.5">Instant BDT Payout via {MFS_METHODS[selectedMfs]?.type} Gateway API.</p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Selection */}
          {methodCategory === 'BANK' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Select Bangladeshi Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => {
                      setSelectedBank(e.target.value);
                      const matched = BANK_OPTIONS.find(b => b.name === e.target.value);
                      if (matched) setRoutingNumber(matched.routing);
                    }}
                    className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b.code} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Branch Name</label>
                  <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g. Gulshan Main Branch" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Routing Number</label>
                  <Input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} placeholder="e.g. 090262100" />
                </div>
              </div>

              {/* Bank Information Box */}
              <div className="rounded-2xl border border-[var(--sky)]/30 bg-[var(--sky-soft)] p-4 flex items-start gap-3 text-xs">
                <Building className="h-4 w-4 shrink-0 text-[var(--sky)] mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[var(--sky)]">{selectedBank}</p>
                  <p className="text-[var(--text-muted)]">BEFTN / NPSB Direct Deposit • Routing No: <span className="font-mono font-bold">{routingNumber}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Account Reference */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Disbursement Amount (BDT)</label>
              <Input
                type="number"
                value={amount}
                placeholder={amountDue > 0 ? String(amountDue) : "e.g. 25000"}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Account No. / Reference Txn ID</label>
              <Input
                value={reference}
                placeholder={methodCategory === 'MFS' ? "e.g. 017XXXXXXXX" : "Account 101XXXXXXX"}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-1">
            <Button onClick={payNow} disabled={recordPayment.isPending} className="w-full sm:w-auto">
              <CreditCard size={16} className="mr-2" /> {recordPayment.isPending ? 'Executing Disbursement…' : 'Execute Payment Now'}
            </Button>
          </div>

          {/* Payment History & Deletion Option */}
          {livePayments.length > 0 && (
            <div className="border-t border-[var(--border-hairline)] pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Recent Payment Records</T></p>
              <div className="space-y-2">
                {livePayments.slice(0, 10).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-3 shadow-sm transition-all hover:border-[var(--brand)]/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-main)] font-mono">{formatCurrency(p.amount, 'BDT', 'en')}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {p.method} • {p.month}/{p.year} {p.reference ? `• Ref: ${p.reference}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={p.status === 'PAID' ? 'emerald' : 'amber'}>{p.status}</Badge>
                      {isAdmin && (
                        <button
                          onClick={() => deletePayment.mutate({ id: p.id })}
                          disabled={deletePayment.isPending}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--rose)]"
                          title="Remove Payment Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
