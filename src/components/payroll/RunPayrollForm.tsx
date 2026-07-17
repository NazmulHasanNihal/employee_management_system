"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Cpu } from 'lucide-react';

function RunPreview({ month }: { month: string }) {
  const { data, isLoading } = trpc.payroll.getRunPreview.useQuery({ month });
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-[var(--text-muted)]">
        Calculating aggregates...
      </div>
    );
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 font-mono text-sm">
      <div className="flex justify-between text-[var(--text-muted)]"><span>Cycle:</span> <span className="text-white">{data?.month} {data?.year}</span></div>
      <div className="flex justify-between text-[var(--text-muted)]"><span>Total Employees:</span> <span className="text-white">{data?.employeeCount ?? 0}</span></div>
      <div className="flex justify-between text-[var(--text-muted)]"><span>Total Worked Hours:</span> <span className="text-white">{data?.totalHours ?? 0} h</span></div>
      <div className="flex justify-between text-[var(--text-muted)] border-t border-white/10 pt-2 font-bold text-lg"><span>Estimated Net Pay:</span> <span className="text-[var(--verify-green)]">{formatCurrency(data?.estimatedNetTotal ?? 0, 'BDT', 'en')}</span></div>
    </div>
  );
}

interface RunPayrollFormProps {
  onSuccess: () => void;
}

export function RunPayrollForm({ onSuccess }: RunPayrollFormProps) {
  const [step, setStep] = useState(1);
  const [month, setMonth] = useState('July 2026');

  const runAutomatedPayroll = trpc.payroll.runAutomatedPayroll.useMutation({
    onSuccess: (data) => {
      onSuccess();
    }
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <Card className="bg-black/40 backdrop-blur-lg border-[var(--verify-green)]/30 shadow-[0_0_25px_rgba(0,255,0,0.1)] animate-in slide-in-from-top-4 mb-6">
      <CardContent className="p-6">
        <div className="mb-6 border-b border-white/10 pb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <Cpu size={20} className="text-[var(--verify-green)]" /> Disbursement Wizard
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">Step {step} of 3</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 w-8 rounded-full ${step >= i ? 'bg-[var(--verify-green)] shadow-[0_0_10px_var(--verify-green)]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-sm font-mono text-white">1. Select Billing Cycle</h4>
            <div className="max-w-md space-y-2">
              <Label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Billing Cycle (Month)</Label>
              <Input 
                type="text" required value={month} onChange={e => setMonth(e.target.value)}
                className="bg-black/40 border-white/10 text-white focus:border-[var(--verify-green)]"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={nextStep} className="bg-[var(--verify-green)] text-black px-6 font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)]">Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-mono text-white">2. Review Aggregated Financials</h4>
            <RunPreview month={month} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="font-mono bg-transparent border-white/20 text-white hover:bg-white/10">Back</Button>
              <Button onClick={nextStep} className="bg-[var(--verify-green)] text-black px-6 font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)]">Confirm & Proceed</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <h4 className="text-sm font-mono text-white mb-2">3. Execute Disbursement</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">This action will finalize the payroll, generate PDF payslips, and dispatch ACH transfers to employee accounts. This action is irreversible.</p>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button variant="outline" onClick={prevStep} disabled={runAutomatedPayroll.isPending} className="font-mono bg-transparent border-white/20 text-white hover:bg-white/10">Back</Button>
              <Button 
                disabled={runAutomatedPayroll.isPending} 
                onClick={() => runAutomatedPayroll.mutate({ month })}
                className="bg-[var(--verify-green)] text-black px-8 py-6 rounded-lg text-xs font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)] hover:shadow-[0_0_15px_var(--verify-green)] transition-all"
              >
                {runAutomatedPayroll.isPending ? 'Processing...' : 'Authorize Disbursement'}
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
