'use client';

import React, { useState, useTransition } from 'react';
import {
  CreditCard,
  Building2,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Layers,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { toast } from '@/lib/toast';
import { T } from '@/components/Translate';
import {
  executeSinglePaymentRecord,
  executeBulkPaymentBatch,
  createPaymentAdjustmentRecord,
} from '@/app/actions/payments';
import { useRouter } from 'next/navigation';

export interface PaymentRecordItem {
  id: string;
  trxId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    designation?: string | null;
    department?: string | null;
    avatarUrl?: string | null;
    baseSalary?: number | null;
  };
  disbursedBy?: {
    id: string;
    name: string;
    role?: string | null;
  } | null;
  paymentType: string;
  paymentMethod: string;
  batchType: string;
  batchRef?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  branchName?: string | null;
  routingNumber?: string | null;
  baseAmount: number;
  bonuses: number;
  adjustments: number;
  deductions: number;
  netPaidAmount: number;
  remarks?: string | null;
  status: string;
  disbursedAt: Date | string;
}

export interface EmployeeSelectOption {
  id: string;
  name: string;
  email: string;
  designation?: string | null;
  department?: string | null;
  baseSalary?: number | null;
}

export default function PaymentSystemHub({
  records = [],
  employees = [],
  canDisburse = false,
}: {
  records: PaymentRecordItem[];
  employees: EmployeeSelectOption[];
  canDisburse?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'ledger' | 'single' | 'bulk' | 'adjust'>('ledger');

  // Ledger Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterBatch, setFilterBatch] = useState('ALL');

  // Printable Payslip / Bank Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecordItem | null>(null);

  // Single Payment Form State
  const [singleEmpId, setSingleEmpId] = useState('');
  const [singleType, setSingleType] = useState('SALARY');
  const [singleMethod, setSingleMethod] = useState('BANK_TRANSFER');
  const [singleBankName, setSingleBankName] = useState('City Bank PLC');
  const [singleAccountNo, setSingleAccountNo] = useState('110-294810-001');
  const [singleBranch, setSingleBranch] = useState('Gulshan Corporate Branch');
  const [singleRouting, setSingleRouting] = useState('085260124');
  const [singleBase, setSingleBase] = useState<number>(35000);
  const [singleBonus, setSingleBonus] = useState<number>(0);
  const [singleAdjustment, setSingleAdjustment] = useState<number>(0);
  const [singleDeduction, setSingleDeduction] = useState<number>(0);
  const [singleRemarks, setSingleRemarks] = useState('');

  // Bulk Payment Form State
  const [bulkMonth, setBulkMonth] = useState('August 2026');
  const [bulkMethod, setBulkMethod] = useState('BANK_TRANSFER');
  const [bulkBonusPct, setBulkBonusPct] = useState<number>(0);
  const [bulkTaxPct, setBulkTaxPct] = useState<number>(5);
  const [bulkRemarks, setBulkRemarks] = useState('Monthly Corporate Payroll Disbursement');
  const [selectedBulkEmpIds, setSelectedBulkEmpIds] = useState<string[]>([]);

  // Adjustment Form State
  const [adjEmpId, setAdjEmpId] = useState('');
  const [adjType, setAdjType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [adjAmount, setAdjAmount] = useState<number>(5000);
  const [adjReason, setAdjReason] = useState('');
  const [adjDate, setAdjDate] = useState(new Date().toISOString().slice(0, 10));

  // Selected single employee change
  const handleSingleEmpChange = (empId: string) => {
    setSingleEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp && emp.baseSalary) {
      setSingleBase(emp.baseSalary);
    }
  };

  // Selected adjustment employee change
  const handleAdjEmpChange = (empId: string) => {
    setAdjEmpId(empId);
  };

  const selectedAdjEmp = employees.find((e) => e.id === adjEmpId);
  const adjOldSalary = selectedAdjEmp?.baseSalary ?? 30000;
  const adjNewSalary =
    adjType === 'INCREASE'
      ? adjOldSalary + (Number(adjAmount) || 0)
      : Math.max(0, adjOldSalary - (Number(adjAmount) || 0));

  // Net single payment calculation
  const singleNet = Math.max(
    0,
    (Number(singleBase) || 0) +
      (Number(singleBonus) || 0) +
      (Number(singleAdjustment) || 0) -
      (Number(singleDeduction) || 0)
  );

  // Filtered Ledger Records
  const filteredRecords = records.filter((rec) => {
    const matchesQuery =
      rec.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.batchRef && rec.batchRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.bankName && rec.bankName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'ALL' || rec.paymentType === filterType;
    const matchesBatch = filterBatch === 'ALL' || rec.batchType === filterBatch;

    return matchesQuery && matchesType && matchesBatch;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalFiltered = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Summary Metrics
  const totalDisbursed = records.reduce((acc, r) => acc + (r.netPaidAmount || 0), 0);
  const totalSingleCount = records.filter((r) => r.batchType === 'SINGLE').length;
  const totalBulkCount = records.filter((r) => r.batchType === 'BULK_BATCH').length;

  // Submit Handlers
  const handleExecuteSingle = async () => {
    if (!singleEmpId) {
      toast.error('Selection Required', 'Please select an employee for disbursement.');
      return;
    }
    startTransition(async () => {
      const res = await executeSinglePaymentRecord({
        userId: singleEmpId,
        paymentType: singleType,
        paymentMethod: singleMethod,
        bankName: singleBankName,
        accountNumber: singleAccountNo,
        branchName: singleBranch,
        routingNumber: singleRouting,
        baseAmount: singleBase,
        bonuses: singleBonus,
        adjustments: singleAdjustment,
        deductions: singleDeduction,
        remarks: singleRemarks,
      });

      if (res.success && res.record) {
        toast.success(
          'Payment Disbursed Successfully',
          `Disbursed ৳${res.record.netPaidAmount.toLocaleString('en-IN')} to ${
            employees.find((e) => e.id === singleEmpId)?.name
          }. TrxID: ${res.record.trxId}`
        );
        setSelectedReceipt(res.record as any);
        setActiveTab('ledger');
        router.refresh();
      } else {
        toast.error('Disbursement Failed', res.error || 'Could not process payment.');
      }
    });
  };

  const handleExecuteBulk = async () => {
    startTransition(async () => {
      const res = await executeBulkPaymentBatch({
        employeeIds: selectedBulkEmpIds,
        paymentMonth: bulkMonth,
        paymentMethod: bulkMethod,
        bonusPercentage: bulkBonusPct,
        taxDeductionPercentage: bulkTaxPct,
        remarks: bulkRemarks,
      });

      if (res.success) {
        toast.success(
          'Bulk Batch Disbursed',
          `Successfully processed monthly payroll for ${res.count} employees. Total ৳${res.totalDisbursed?.toLocaleString(
            'en-IN'
          )}. Batch: ${res.batchRef}`
        );
        setActiveTab('ledger');
        router.refresh();
      } else {
        toast.error('Bulk Disbursement Failed', res.error || 'Could not process batch.');
      }
    });
  };

  const handleExecuteAdjustment = async () => {
    if (!adjEmpId) {
      toast.error('Selection Required', 'Please select an employee to adjust compensation.');
      return;
    }
    if (!adjReason.trim()) {
      toast.error('Reason Required', 'Please provide a clear reason for salary adjustment.');
      return;
    }
    startTransition(async () => {
      const res = await createPaymentAdjustmentRecord({
        userId: adjEmpId,
        type: adjType,
        amount: adjAmount,
        reason: adjReason,
        effectiveDate: adjDate,
      });

      if (res.success) {
        toast.success(
          'Salary Adjustment Applied',
          `${adjType === 'INCREASE' ? 'Increased' : 'Decreased'} salary for ${
            selectedAdjEmp?.name
          } by ৳${adjAmount.toLocaleString('en-IN')}. New Salary: ৳${res.newSalary?.toLocaleString('en-IN')}`
        );
        setActiveTab('ledger');
        router.refresh();
      } else {
        toast.error('Adjustment Failed', res.error || 'Could not apply adjustment.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER SUMMARY METRICS CARD ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-[var(--brand)]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Total Disbursed Ledger</T>
          </p>
          <h3 className="mt-2 text-2xl font-black text-[var(--brand)]">
            ৳{totalDisbursed.toLocaleString('en-IN')}
          </h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <ShieldCheck size={12} className="text-[var(--emerald)]" />
            {/* @ts-ignore */}<T>Verified Real-Life Bank Payouts</T>
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers size={64} className="text-[var(--brand)]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Bulk Batch Payrolls</T>
          </p>
          <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">{totalBulkCount}</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Corporate Automated Batches</T>
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={64} className="text-[var(--brand)]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Single Disbursements</T>
          </p>
          <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">{totalSingleCount}</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Direct Bank / MFS Transfers</T>
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={64} className="text-[var(--brand)]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Active Payroll Roster</T>
          </p>
          <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">{employees.length}</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Eligible Corporate Employees</T>
          </p>
        </div>
      </div>

      {/* ── NAVIGATION TABS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-2 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'ledger'
                ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/30'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText size={16} />
            {/* @ts-ignore */}<T>Bank Payment Ledger</T>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {records.length}
            </Badge>
          </button>

          {canDisburse && (
            <>
              <button
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'single'
                    ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/30'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                <CreditCard size={16} />
                {/* @ts-ignore */}<T>Single Payment Simulator</T>
              </button>

              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'bulk'
                    ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/30'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                <Layers size={16} />
                {/* @ts-ignore */}<T>Bulk Payroll Simulator</T>
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'adjust'
                    ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/30'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                <TrendingUp size={16} />
                {/* @ts-ignore */}<T>Payment Increase / Decrease</T>
              </button>
            </>
          )}
        </div>

        <div className="px-3">
          <span className="text-[11px] font-bold text-[var(--brand)] uppercase tracking-wider">
            {/* @ts-ignore */}<T>Real-Life Simulation Engine Active</T>
          </span>
        </div>
      </div>

      {/* ── TAB 1: BANK PAYMENT LEDGER & AUDIT TRAIL ── */}
      {activeTab === 'ledger' && (
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-xl space-y-5 animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TrxID, employee, bank..."
                className="pl-10 h-10 rounded-2xl text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none"
              >
                <option value="ALL">All Payment Types</option>
                <option value="SALARY">Salary</option>
                <option value="BONUS">Bonus</option>
                <option value="ALLOWANCE">Allowance</option>
                <option value="REIMBURSEMENT">Reimbursement</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>

              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="h-10 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none"
              >
                <option value="ALL">All Batch Types</option>
                <option value="SINGLE">Single Disbursements</option>
                <option value="BULK_BATCH">Bulk Batches</option>
              </select>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-sm text-[var(--text-muted)] space-y-3">
              <Building2 size={40} className="mx-auto text-[var(--brand)] opacity-50" />
              <p className="font-semibold">{/* @ts-ignore */}<T>No payment records found.</T></p>
              <p className="text-xs">{/* @ts-ignore */}<T>Disburse a single or bulk payment to populate the real-life bank ledger.</T></p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-hover)]/60 text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Transaction ID & Type</th>
                    <th className="py-3.5 px-4">Recipient Employee</th>
                    <th className="py-3.5 px-4">Bank / MFS Method</th>
                    <th className="py-3.5 px-4">Base Salary</th>
                    <th className="py-3.5 px-4">Increases (+)</th>
                    <th className="py-3.5 px-4">Deductions (-)</th>
                    <th className="py-3.5 px-4">Net Disbursed Amount</th>
                    <th className="py-3.5 px-4 text-center">Receipt & Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {paginatedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[var(--brand)] text-[11px]">
                          {rec.trxId}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="brand" className="text-[9px] uppercase">
                            {rec.paymentType}
                          </Badge>
                          {rec.batchType === 'BULK_BATCH' ? (
                            <span className="text-[10px] font-semibold text-[var(--emerald)]">
                              [Bulk Batch]
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">[Single]</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={rec.user.avatarUrl} name={rec.user.name} size="sm" />
                          <div>
                            <p className="font-bold text-[var(--text-main)]">{rec.user.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {rec.user.designation || rec.user.department || 'Employee'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[var(--text-main)]">{rec.bankName || rec.paymentMethod}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">
                          {rec.accountNumber || 'A/C Confirmed'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">
                        ৳{rec.baseAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[var(--emerald)]">
                        +{rec.bonuses + (rec.adjustments > 0 ? rec.adjustments : 0) > 0
                          ? `৳${(rec.bonuses + (rec.adjustments > 0 ? rec.adjustments : 0)).toLocaleString('en-IN')}`
                          : '৳0'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[var(--rose)]">
                        -{rec.deductions + (rec.adjustments < 0 ? Math.abs(rec.adjustments) : 0) > 0
                          ? `৳${(rec.deductions + (rec.adjustments < 0 ? Math.abs(rec.adjustments) : 0)).toLocaleString('en-IN')}`
                          : '৳0'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black text-[var(--brand)]">
                          ৳{rec.netPaidAmount.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-[var(--emerald)] font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> SETTLED
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSelectedReceipt(rec)}
                          className="rounded-xl flex items-center gap-1 mx-auto"
                        >
                          <Printer size={12} />
                          <span>Receipt</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[var(--border-hairline)] bg-[var(--bg-panel)] rounded-b-xl">
                  <p className="text-xs text-[var(--text-muted)]">
                    Showing <span className="font-bold text-[var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[var(--text-main)]">{Math.min(currentPage * itemsPerPage, totalFiltered)}</span> of <span className="font-bold text-[var(--text-main)]">{totalFiltered}</span> records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg h-8"
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-semibold px-2">Page {currentPage} of {totalPages}</span>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SINGLE PAYMENT DISBURSEMENT SIMULATOR ── */}
      {activeTab === 'single' && (
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-xl space-y-6 animate-in fade-in">
          <div className="border-b border-[var(--border-hairline)] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <CreditCard className="text-[var(--brand)]" size={20} />
                {/* @ts-ignore */}<T>Single Employee Direct Payment Dispatch</T>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Disburse salary, festival bonus, reimbursement or ad-hoc payment directly into bank/MFS account.</T>
              </p>
            </div>
            <Badge variant="brand">{/* @ts-ignore */}<T>Instant Settlement</T></Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Form Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Target Recipient Employee *</T>
                </label>
                <select
                  value={singleEmpId}
                  onChange={(e) => handleSingleEmpChange(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || 'Staff'}) — Base: ৳
                      {(emp.baseSalary || 35000).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Payment Type</T>
                </label>
                <select
                  value={singleType}
                  onChange={(e) => setSingleType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                >
                  <option value="SALARY">Monthly Base Salary</option>
                  <option value="BONUS">Festival / Performance Bonus</option>
                  <option value="ALLOWANCE">Transport / Medical Allowance</option>
                  <option value="REIMBURSEMENT">Expense Reimbursement</option>
                  <option value="OVERTIME">Overtime Compensation</option>
                  <option value="ADJUSTMENT">Ad-hoc Adjustment Payout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Disbursement Channel / Method</T>
                </label>
                <select
                  value={singleMethod}
                  onChange={(e) => setSingleMethod(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                >
                  <option value="BANK_TRANSFER">BEFTN Bank Transfer</option>
                  <option value="BKASH">bKash Corporate MFS</option>
                  <option value="NAGAD">Nagad Corporate Wallet</option>
                  <option value="EFT">NPSB Direct EFT</option>
                  <option value="CHECK">Account Payee Check</option>
                  <option value="CASH">Cash Disbursement</option>
                </select>
              </div>
            </div>

            {/* Form Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Bank / Financial Provider Name</T>
                </label>
                <Input
                  value={singleBankName}
                  onChange={(e) => setSingleBankName(e.target.value)}
                  placeholder="e.g. City Bank PLC / bKash"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Account / Mobile Wallet Number</T>
                </label>
                <Input
                  value={singleAccountNo}
                  onChange={(e) => setSingleAccountNo(e.target.value)}
                  placeholder="e.g. 110-294810-001 or 01700000000"
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    {/* @ts-ignore */}<T>Branch Name</T>
                  </label>
                  <Input
                    value={singleBranch}
                    onChange={(e) => setSingleBranch(e.target.value)}
                    placeholder="Gulshan Main"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    {/* @ts-ignore */}<T>Routing No.</T>
                  </label>
                  <Input
                    value={singleRouting}
                    onChange={(e) => setSingleRouting(e.target.value)}
                    placeholder="085260124"
                    className="h-10 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Form Column 3: Live Breakdown & Real-Time Net Calculator */}
            <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  {/* @ts-ignore */}<T>Live Real-Time Payout Breakdown</T>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Base Amount (৳)</label>
                    <Input
                      type="number"
                      value={singleBase}
                      onChange={(e) => setSingleBase(Number(e.target.value))}
                      className="h-8 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--emerald)] font-bold uppercase">Bonus / Incentive (+৳)</label>
                    <Input
                      type="number"
                      value={singleBonus}
                      onChange={(e) => setSingleBonus(Number(e.target.value))}
                      className="h-8 text-xs font-bold text-[var(--emerald)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--brand)] font-bold uppercase">Increase / Delta (+/-৳)</label>
                    <Input
                      type="number"
                      value={singleAdjustment}
                      onChange={(e) => setSingleAdjustment(Number(e.target.value))}
                      className="h-8 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--rose)] font-bold uppercase">Deduction / Tax (-৳)</label>
                    <Input
                      type="number"
                      value={singleDeduction}
                      onChange={(e) => setSingleDeduction(Number(e.target.value))}
                      className="h-8 text-xs font-bold text-[var(--rose)]"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--bg-panel)] p-4 border border-[var(--brand)]/30 text-center shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    {/* @ts-ignore */}<T>Calculated Net Disbursed Payout</T>
                  </span>
                  <div className="text-2xl font-black text-[var(--brand)] mt-1">
                    ৳{singleNet.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleExecuteSingle}
                disabled={isPending || !singleEmpId}
                className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-[var(--brand)]/20"
              >
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{/* @ts-ignore */}<T>Disburse Payment & Generate TrxID</T></span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: BULK CORPORATE PAYROLL SIMULATOR ── */}
      {activeTab === 'bulk' && (
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-xl space-y-6 animate-in fade-in">
          <div className="border-b border-[var(--border-hairline)] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <Layers className="text-[var(--brand)]" size={20} />
                {/* @ts-ignore */}<T>Corporate Bulk Payroll Batch Simulation</T>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Execute automated monthly payroll disbursement for all active corporate employees simultaneously.</T>
              </p>
            </div>
            <Badge variant="brand">{/* @ts-ignore */}<T>BEFTN Batch Engine</T></Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Disbursement Month / Period</T>
                </label>
                <Input
                  value={bulkMonth}
                  onChange={(e) => setBulkMonth(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Payment Channel</T>
                </label>
                <select
                  value={bulkMethod}
                  onChange={(e) => setBulkMethod(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none"
                >
                  <option value="BANK_TRANSFER">BEFTN Corporate Corporate Payroll</option>
                  <option value="BKASH">bKash Bulk Salary Disbursement</option>
                  <option value="NAGAD">Nagad Enterprise Disbursement</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--emerald)] mb-1">
                  {/* @ts-ignore */}<T>Global Bonus Percentage (% of Base)</T>
                </label>
                <Input
                  type="number"
                  value={bulkBonusPct}
                  onChange={(e) => setBulkBonusPct(Number(e.target.value))}
                  placeholder="0"
                  className="h-10 text-xs rounded-xl font-bold text-[var(--emerald)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--rose)] mb-1">
                  {/* @ts-ignore */}<T>Global Statutory Tax / PF Deduction (%)</T>
                </label>
                <Input
                  type="number"
                  value={bulkTaxPct}
                  onChange={(e) => setBulkTaxPct(Number(e.target.value))}
                  placeholder="5"
                  className="h-10 text-xs rounded-xl font-bold text-[var(--rose)]"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                  {/* @ts-ignore */}<T>Batch Disbursement Summary</T>
                </h4>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Total Eligible Employees: <strong className="text-[var(--text-main)]">{employees.length} Staff</strong>
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Estimated Batch Total: <strong className="text-[var(--brand)]">৳{(employees.reduce((acc, e) => acc + (e.baseSalary || 35000), 0) * (1 + bulkBonusPct / 100 - bulkTaxPct / 100)).toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleExecuteBulk}
                disabled={isPending || employees.length === 0}
                className="w-full rounded-2xl py-3 flex items-center justify-center gap-2"
              >
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{/* @ts-ignore */}<T>Execute Bulk Batch Disbursement</T></span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PAYMENT INCREASE / DECREASE ADJUSTMENT ── */}
      {activeTab === 'adjust' && (
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-xl space-y-6 animate-in fade-in">
          <div className="border-b border-[var(--border-hairline)] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <TrendingUp className="text-[var(--brand)]" size={20} />
                {/* @ts-ignore */}<T>Salary Payment Increase & Decrease Adjustments</T>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Log official salary increments, merit raises, or performance deductions with full audit trail.</T>
              </p>
            </div>
            <Badge variant="brand">{/* @ts-ignore */}<T>Audit Logged</T></Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Target Employee *</T>
                </label>
                <select
                  value={adjEmpId}
                  onChange={(e) => handleAdjEmpChange(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || 'Staff'}) — Current Base: ৳
                      {(emp.baseSalary || 30000).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Adjustment Action Type</T>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('INCREASE')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      adjType === 'INCREASE'
                        ? 'border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]'
                        : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
                    }`}
                  >
                    <ArrowUpRight size={16} /> Increase (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('DECREASE')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      adjType === 'DECREASE'
                        ? 'border-[var(--rose)] bg-[var(--rose)]/10 text-[var(--rose)]'
                        : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
                    }`}
                  >
                    <ArrowDownRight size={16} /> Decrease (-)
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Adjustment Amount (৳) *</T>
                </label>
                <Input
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  className="h-10 text-xs font-bold rounded-xl"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  {/* @ts-ignore */}<T>Official Reason / Justification *</T>
                </label>
                <Input
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Annual Merit Increment / Performance Review"
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                  {/* @ts-ignore */}<T>Live Salary Preview</T>
                </h4>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Current Salary:</span>
                    <span className="font-bold">৳{adjOldSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Adjustment Delta:</span>
                    <span className={`font-bold ${adjType === 'INCREASE' ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}`}>
                      {adjType === 'INCREASE' ? '+' : '-'}৳{adjAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border-t border-[var(--border-hairline)] pt-2 flex justify-between">
                    <span className="font-bold text-[var(--text-main)]">New Base Salary:</span>
                    <span className="font-black text-sm text-[var(--brand)]">৳{adjNewSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleExecuteAdjustment}
                disabled={isPending || !adjEmpId || !adjReason.trim()}
                className="w-full rounded-2xl py-3 flex items-center justify-center gap-2"
              >
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>{/* @ts-ignore */}<T>Apply Adjustment & Log Audit</T></span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE CORPORATE PAYMENT RECEIPT / SLIP MODAL ── */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto my-auto rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4 sm:p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Slip Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white font-black text-base">
                  Ops
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                    Official Corporate Payment Voucher
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    Bank Ref: {selectedReceipt.trxId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Slip Body */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--bg-hover)]/40 p-3 border border-[var(--border-hairline)]">
                <div>
                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold">Recipient Employee</span>
                  <p className="font-bold text-xs text-[var(--text-main)]">{selectedReceipt.user.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{selectedReceipt.user.designation || 'Staff'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold">Disbursement Channel</span>
                  <p className="font-bold text-xs text-[var(--brand)]">{selectedReceipt.bankName || selectedReceipt.paymentMethod}</p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">{selectedReceipt.accountNumber}</p>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="rounded-xl border border-[var(--border-hairline)] overflow-hidden divide-y divide-[var(--border-hairline)]">
                <div className="flex justify-between px-3 py-2 bg-[var(--bg-hover)]/30 font-semibold">
                  <span>Base Monthly Salary</span>
                  <span>৳{selectedReceipt.baseAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between px-3 py-2 font-semibold text-[var(--emerald)]">
                  <span>Bonuses & Allowances (+)</span>
                  <span>+৳{selectedReceipt.bonuses.toLocaleString('en-IN')}</span>
                </div>
                {selectedReceipt.adjustments !== 0 && (
                  <div className="flex justify-between px-3 py-2 font-semibold">
                    <span>Payment Adjustment ({selectedReceipt.adjustments > 0 ? '+' : '-'})</span>
                    <span>৳{selectedReceipt.adjustments.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between px-3 py-2 font-semibold text-[var(--rose)]">
                  <span>Statutory Tax & PF Deductions (-)</span>
                  <span>-৳{selectedReceipt.deductions.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between px-3 py-2.5 bg-[var(--brand)]/10 font-black text-xs text-[var(--brand)]">
                  <span>NET DISBURSED AMOUNT</span>
                  <span>৳{selectedReceipt.netPaidAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                <div>
                  Disbursed By: <strong className="text-[var(--text-main)]">{selectedReceipt.disbursedBy?.name || 'System Admin'}</strong>
                </div>
                <div>
                  Date: <strong className="text-[var(--text-main)]">{new Date(selectedReceipt.disbursedAt).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Slip Footer Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 rounded-xl h-8 text-xs"
              >
                Close Slip
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="flex-1 rounded-xl h-8 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Official Slip</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
