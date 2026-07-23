'use client';

import React from 'react';
import { Wallet, TrendingUp, Smartphone, Landmark, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

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

const METHOD_META: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  BKASH: { label: 'bKash', icon: <Smartphone className="h-4 w-4" />, tone: 'text-[#e2136e] bg-[#fde9f2]' },
  ROCKET: { label: 'Rocket', icon: <Rocket className="h-4 w-4" />, tone: 'text-[#7b2bf9] bg-[#f1e9fe]' },
  BANK: { label: 'Bank', icon: <Landmark className="h-4 w-4" />, tone: 'text-[var(--sky)] bg-[var(--sky-soft)]' },
};

function Rocket(props: any) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>; }

export function PaymentHub({ isAdmin, latestPayslip, salesThisMonth, salesLastMonth, payments, month, year, userId }: PaymentHubProps) {
  const [method, setMethod] = React.useState<'BKASH' | 'ROCKET' | 'BANK'>('BKASH');
  const [reference, setReference] = React.useState('');
  const [amount, setAmount] = React.useState<string>('');

  // Mount the payment list as a live query (seeded with the server prop) so
  // recording a payment refreshes the paid-status in place — no full reload.
  const utils = trpc.useUtils();
  const { data: paymentData } = trpc.payroll.getPayments.useQuery(undefined, { initialData: payments as any });
  const livePayments = (paymentData as any[] | undefined) ?? payments;

  const amountDue = latestPayslip?.netPay ?? latestPayslip?.totalAmount ?? 0;
  const relatedPayment = livePayments.find((p) => p.payrollId === latestPayslip?.id) || null;
  const isPaid = relatedPayment?.status === 'PAID';

  const recordPayment = trpc.payroll.recordPayment.useMutation({
    onSuccess: () => { utils.payroll.getPayments.invalidate(); setReference(''); setAmount(''); },
  });

  const payNow = () => {
    const payAmount = Number(amount) || amountDue;
    recordPayment.mutate({
      userId,
      payrollId: latestPayslip?.id || null,
      month,
      year,
      amount: payAmount,
      method,
      reference: reference || undefined,
      status: 'PAID',
      details: isAdmin ? 'Manual entry (admin)' : `Paid via ${method}`,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Sales overview */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp size={16} className="text-[var(--brand-strong)]" /> My Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-[var(--brand-soft)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--brand-strong)]">This Month</p>
            <p className="text-fluid-2xl font-bold text-[var(--text-main)]">{formatCurrency(salesThisMonth, 'BDT', 'en')}</p>
          </div>
          <div className="rounded-2xl bg-[var(--bg-hover)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Last Month</p>
            <p className="text-fluid-2xl font-bold text-[var(--text-main)]">{formatCurrency(salesLastMonth, 'BDT', 'en')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment status + pay now */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet size={16} className="text-[var(--brand-strong)]" /> Payment Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Latest Payslip ({month}/{year})</p>
              <p className="text-xl font-bold text-[var(--text-main)]">{formatCurrency(amountDue, 'BDT', 'en')}</p>
            </div>
            {isPaid ? (
              <Badge variant="emerald" className="gap-1"><CheckCircle2 size={12} /> Paid {relatedPayment ? `via ${METHOD_META[relatedPayment.method]?.label || relatedPayment.method}` : ''}</Badge>
            ) : (
              <Badge variant="amber" className="gap-1"><AlertCircle size={12} /> Balance Due</Badge>
            )}
          </div>

          {!isPaid && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Pay Using</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BKASH', 'ROCKET', 'BANK'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${method === m ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      {METHOD_META[m].icon} {METHOD_META[m].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Amount (auto = due)</label>
                  <Input value={amount} placeholder={String(amountDue)} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Reference / Account No.</label>
                  <Input value={reference} placeholder="e.g. 01XXXXXXXXX" onChange={(e) => setReference(e.target.value)} />
                </div>
              </div>
              <Button onClick={payNow} disabled={recordPayment.isPending} className="w-full sm:w-auto">
                <CreditCard size={16} className="mr-2" /> {recordPayment.isPending ? 'Processing…' : 'Pay Now'}
              </Button>
              <p className="text-[10px] text-[var(--text-muted)]">
                Payments are recorded for reconciliation. Live gateway integration (bKash/Rocket API) can be enabled via admin settings.
              </p>
            </div>
          )}

          {payments.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Payment History</p>
              <div className="space-y-2">
                {payments.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${METHOD_META[p.method]?.tone || 'bg-[var(--bg-hover)]'}`}>
                        {METHOD_META[p.method]?.icon || <CreditCard size={14} />}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">{formatCurrency(p.amount, 'BDT', 'en')}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{p.month}/{p.year} {p.reference ? `· ${p.reference}` : ''}</p>
                      </div>
                    </div>
                    <Badge variant={p.status === 'PAID' ? 'emerald' : 'amber'}>{p.status}</Badge>
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

// Lightweight inline input to avoid extra import churn
function InputLike({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="ledger-input w-full rounded-lg px-3 py-2.5 text-sm"
    />
  );
}
