'use client';

import React, { useState } from 'react';
import { Download, Calculator, FileSpreadsheet, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RunPayrollForm } from '@/components/payroll/RunPayrollForm';
import { downloadCSV, toPfCsv, toGratuityCsv } from '@/lib/export';

interface PayrollActionsProps {
  payrolls: any[];
}

function payslipCsv(payrolls: any[]): (string | number)[][] {
  const header = ['ID', 'Month', 'Year', 'Status', 'Earnings', 'Deductions', 'Tax', 'Net Pay', 'PF', 'Festival Bonus', 'Employee Name', 'Employee Email'];
  const body = payrolls.map((pay: any) => [
    pay.id,
    pay.month,
    pay.year,
    pay.status,
    pay.earnings ?? 0,
    pay.deductions ?? 0,
    pay.tax ?? 0,
    pay.netPay ?? pay.totalAmount ?? 0,
    pay.providentFund ?? 0,
    pay.festivalBonus ?? 0,
    pay.user?.name || 'N/A',
    pay.user?.email || 'N/A',
  ]);
  return [header, ...body];
}

export function PayrollActions({ payrolls }: PayrollActionsProps) {
  const [showGenerate, setShowGenerate] = useState(false);

  const exportPF = () => downloadCSV('pf_statement.csv', toPfCsv(payrolls));
  const exportGratuity = () => downloadCSV('gratuity_report.csv', toGratuityCsv(payrolls));
  const exportFull = () => downloadCSV('payroll_export.csv', payslipCsv(payrolls));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={exportPF} title="Provident Fund statement (CSV)" className="touch-target-sm">
          <PiggyBank className="h-4 w-4" /> PF
        </Button>
        <Button variant="outline" size="sm" onClick={exportGratuity} title="Gratuity accrual report (CSV)" className="touch-target-sm">
          <FileSpreadsheet className="h-4 w-4" /> Gratuity
        </Button>
        <Button variant="outline" size="sm" onClick={exportFull} title="Full payroll export (CSV)" className="touch-target-sm">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowGenerate((s) => !s)} className="touch-target-sm">
          <Calculator className="h-4 w-4" />
          {showGenerate ? 'Cancel Operation' : 'Run Payroll'}
        </Button>
      </div>

      {showGenerate && (
        <div className="animate-scale-in">
          <RunPayrollForm onSuccess={() => setShowGenerate(false)} />
        </div>
      )}
    </>
  );
}
