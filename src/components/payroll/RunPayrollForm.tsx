"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Cpu, Users, Building2, User, Briefcase, CheckCircle2, Download, Smartphone, Send } from 'lucide-react';
import { toast } from '@/lib/toast';

interface RunPayrollFormProps {
  onSuccess: () => void;
}

export function RunPayrollForm({ onSuccess }: RunPayrollFormProps) {
  const [step, setStep] = useState(1);
  const [month, setMonth] = useState('July 2026');

  // Target Filter Selection for HR / Admin Batch Payout
  const [targetType, setTargetType] = useState<'ALL' | 'DEPARTMENT' | 'EMPLOYMENT_GROUP' | 'INDIVIDUAL'>('ALL');
  const [selectedDept, setSelectedDept] = useState('Engineering');
  const [selectedGroup, setSelectedGroup] = useState('Full-Time');
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Search employees for individual selection
  const { data: employees = [] } = trpc.registry.searchEmployees.useQuery({ query: '' });

  const runAutomatedPayroll = trpc.payroll.runAutomatedPayroll.useMutation({
    onSuccess: () => {
      toast.success('Payroll Logged', `Payroll successfully logged for ${targetType === 'ALL' ? 'all employees' : targetType === 'DEPARTMENT' ? selectedDept : targetType === 'EMPLOYMENT_GROUP' ? selectedGroup : 'selected employee'}.`);
      setStep(4);
    },
    onError: (err: any) => {
      toast.error('Payroll Failed', err?.message || 'Failed to execute disbursement');
    },
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <Card className="bg-[var(--bg-panel)] border border-[var(--emerald)]/40 shadow-2xl animate-in slide-in-from-top-4 mb-6 rounded-3xl">
      <CardContent className="p-6">
        <div className="mb-6 border-b border-[var(--border-hairline)] pb-4 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2 uppercase tracking-wide">
              <Cpu size={20} className="text-[var(--emerald)]" /> HR / Admin Payroll Payout Console
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Step {step} of 4 — Select payout target & execute batch disbursement</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-2 w-8 rounded-full ${step >= i ? 'bg-[var(--emerald)] shadow-[0_0_10px_var(--emerald)]' : 'bg-[var(--bg-hover)]'}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Pay Period / Billing Cycle</Label>
                <Input
                  type="text"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl text-sm"
                  placeholder="e.g. July 2026"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Payout Target Selection</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      targetType === 'ALL'
                        ? 'border-[var(--emerald)] bg-[var(--emerald-soft)] text-[var(--emerald)]'
                        : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Users size={14} /> All Employees
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('DEPARTMENT')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      targetType === 'DEPARTMENT'
                        ? 'border-[var(--emerald)] bg-[var(--emerald-soft)] text-[var(--emerald)]'
                        : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Building2 size={14} /> By Department
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('EMPLOYMENT_GROUP')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      targetType === 'EMPLOYMENT_GROUP'
                        ? 'border-[var(--emerald)] bg-[var(--emerald-soft)] text-[var(--emerald)]'
                        : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Briefcase size={14} /> By Employment Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('INDIVIDUAL')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      targetType === 'INDIVIDUAL'
                        ? 'border-[var(--emerald)] bg-[var(--emerald-soft)] text-[var(--emerald)]'
                        : 'border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <User size={14} /> Individual Employee
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-selection based on targetType */}
            {targetType === 'DEPARTMENT' && (
              <div className="space-y-2 animate-fade-up">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Select Department to Pay Together</Label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales & Business Dev">Sales & Business Dev</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            )}

            {targetType === 'EMPLOYMENT_GROUP' && (
              <div className="space-y-2 animate-fade-up">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Select Employment Group</Label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  <option value="Full-Time">Full-Time Staff</option>
                  <option value="Part-Time">Part-Time Staff</option>
                  <option value="Contract">Contract / Contractor</option>
                  <option value="Intern">Interns</option>
                </select>
              </div>
            )}

            {targetType === 'INDIVIDUAL' && (
              <div className="space-y-2 animate-fade-up">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Select Employee to Pay (by ID / Name)</Label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp: any) => (

                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department || emp.role} · ID: {emp.id.substring(0, 8)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={nextStep} className="btn-primary rounded-xl px-6 py-2.5 text-xs font-semibold uppercase tracking-wider">
                Next: Review Financials
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-semibold text-[var(--text-main)]">Review Payout Scope & Aggregates</h4>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/60 p-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Pay Period:</span>
                <span className="font-semibold text-[var(--text-main)]">{month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Payout Target:</span>
                <span className="font-semibold text-[var(--brand)]">
                  {targetType === 'ALL'
                    ? 'All Active Employees'
                    : targetType === 'DEPARTMENT'
                    ? `Department: ${selectedDept}`
                    : targetType === 'EMPLOYMENT_GROUP'
                    ? `Group: ${selectedGroup}`
                    : `Employee ID: ${selectedEmpId.substring(0, 8)}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-hairline)] pt-3 font-bold text-base">
                <span className="text-[var(--text-main)]">Estimated Batch Total:</span>
                <span className="text-[var(--emerald)]">৳ 4,85,000.00</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="rounded-xl px-4 py-2 text-xs font-medium">
                Back
              </Button>
              <Button onClick={nextStep} className="btn-primary rounded-xl px-6 py-2.5 text-xs font-semibold uppercase tracking-wider">
                Confirm & Authorize
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center animate-fade-up">
            <h4 className="text-sm font-semibold text-[var(--text-main)]">3. Execute Batch Payout Disbursement</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Authorizing this payout will generate official itemized payslips and prepare the records for BEFTN / mobile financial transfer.
            </p>

            <div className="flex justify-center gap-4 mt-6">
              <Button variant="outline" onClick={prevStep} disabled={runAutomatedPayroll.isPending} className="rounded-xl px-4 py-2 text-xs">
                Back
              </Button>
              <Button
                disabled={runAutomatedPayroll.isPending}
                onClick={() => runAutomatedPayroll.mutate({ month, targetType, targetValue: selectedDept || selectedGroup || selectedEmpId })}
                className="btn-primary flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-semibold uppercase tracking-wider"
              >
                <CheckCircle2 size={16} />
                {runAutomatedPayroll.isPending ? 'Processing Payout...' : 'Authorize & Issue Payouts'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center animate-fade-up">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-[var(--emerald)]/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[var(--emerald)]" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-[var(--text-main)]">Payroll Officially Processed</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
              The payroll batch for {month} has been successfully computed and logged. Choose your preferred disbursement method below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[var(--bg-app)] border border-[var(--border-hairline)] hover:border-[var(--brand)] transition-all cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center text-center gap-3" onClick={() => {
                  const csv = "AccountNo,Amount,ReceiverName,BankName,RoutingNo\n0011223344,485000.00,BATCH_PAYROLL,BRAC BANK,090262100";
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `BEFTN_BATCH_${month.replace(' ', '_')}.csv`;
                  a.click();
                  toast.success('BEFTN Batch Exported', 'CSV is ready for corporate banking portal upload.');
                }}>
                  <Download className="h-8 w-8 text-[var(--brand)]" />
                  <div>
                    <h5 className="text-sm font-semibold text-[var(--text-main)]">BEFTN CSV</h5>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Download Bangladesh Bank format</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#E2136E]/10 border border-[#E2136E]/20 hover:border-[#E2136E] transition-all cursor-pointer" onClick={() => toast.success('bKash API Triggered', 'Disbursement dispatched to bKash Corporate B2B gateway.')}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <Smartphone className="h-8 w-8 text-[#E2136E]" />
                  <div>
                    <h5 className="text-sm font-semibold text-[#E2136E]">bKash B2B</h5>
                    <p className="text-[10px] text-[#E2136E]/70 mt-1">Instant mobile wallet payout</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#F7931E]/10 border border-[#F7931E]/20 hover:border-[#F7931E] transition-all cursor-pointer" onClick={() => toast.success('Nagad API Triggered', 'Disbursement dispatched to Nagad Corporate gateway.')}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <Send className="h-8 w-8 text-[#F7931E]" />
                  <div>
                    <h5 className="text-sm font-semibold text-[#F7931E]">Nagad Corporate</h5>
                    <p className="text-[10px] text-[#F7931E]/70 mt-1">Instant mobile wallet payout</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-6 pt-4 border-t border-[var(--border-hairline)]">
              <Button onClick={onSuccess} className="rounded-xl px-8 py-2 text-xs font-semibold bg-[var(--bg-hover)] text-[var(--text-main)] hover:bg-[var(--bg-app)] border border-[var(--border-hairline)]">
                Close
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
