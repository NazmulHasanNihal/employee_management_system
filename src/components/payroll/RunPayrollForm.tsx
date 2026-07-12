"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Cpu } from 'lucide-react';

interface RunPayrollFormProps {
  onSuccess: () => void;
}

export function RunPayrollForm({ onSuccess }: RunPayrollFormProps) {
  const [month, setMonth] = useState('July 2026');

  const runAutomatedPayroll = trpc.payroll.runAutomatedPayroll.useMutation({
    onSuccess: (data) => {
      alert(`Successfully generated payslips for ${data.count} employees based on their attendance and formulas!`);
      onSuccess();
    }
  });

  return (
    <Card className="bg-black/40 backdrop-blur-lg border-[var(--verify-green)]/30 shadow-[0_0_25px_rgba(0,255,0,0.1)] animate-in slide-in-from-top-4 mb-6">
      <CardContent className="p-6">
        <div className="mb-6 border-b border-white/10 pb-4">
          <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Cpu size={20} className="text-[var(--verify-green)]" /> Automated Batch Payroll
          </h3>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">This will scan all employee attendance records for the selected month, apply their assigned Payroll Structure formulas, and generate payslips automatically.</p>
        </div>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); runAutomatedPayroll.mutate({ month }); }}>
          <div className="max-w-md space-y-2">
            <Label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Billing Cycle (Month)</Label>
            <Input 
              type="text" required value={month} onChange={e => setMonth(e.target.value)}
              className="bg-black/40 border-white/10 text-white focus:border-[var(--verify-green)]"
            />
          </div>
          
          <Button disabled={runAutomatedPayroll.isPending} type="submit" className="bg-[var(--verify-green)] text-black px-6 py-6 mt-4 rounded-lg text-xs font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)] hover:shadow-[0_0_15px_var(--verify-green)] transition-all flex items-center gap-2">
            {runAutomatedPayroll.isPending ? 'Processing...' : 'Execute Automation Sequence'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
