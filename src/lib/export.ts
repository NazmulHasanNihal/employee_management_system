// CSV export helpers (client-side) for statutory Bangladesh reports.

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows
    .map((r) =>
      r
        .map((cell) =>
          typeof cell === 'number' ? String(cell) : escape(cell)
        )
        .join(',')
    )
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel Bangla
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface PfRow {
  employeeName: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  providentFund: number;
}

export interface PfCsvRow {
  user?: { name?: string; id?: string; baseSalary?: number };
  month: string;
  year: number;
  baseSalary?: number;
  providentFund: number;
}

export interface GratuityCsvRow {
  user?: { name?: string; id?: string; baseSalary?: number };
  month: string;
  year: number;
  baseSalary?: number;
  gratuityAccrued: number;
}

export interface FestivalBonusCsvRow {
  user?: { name?: string; id?: string };
  year: number;
  occasion: string;
  baseSalarySnapshot: number;
  amount: number;
  status: string;
}

export function toPfCsv(payrolls: PfCsvRow[]): (string | number)[][] {
  const header = ['Employee', 'Employee ID', 'Month', 'Year', 'Basic Salary (BDT)', 'Provident Fund (BDT)'];
  const body = payrolls.map((p) => [
    p.user?.name || 'N/A',
    p.user?.id || '',
    p.month,
    p.year,
    p.baseSalary ?? p.user?.baseSalary ?? 0,
    p.providentFund ?? 0,
  ]);
  return [header, ...body];
}

export function toGratuityCsv(payrolls: GratuityCsvRow[]): (string | number)[][] {
  const header = ['Employee', 'Employee ID', 'Month', 'Year', 'Basic Salary (BDT)', 'Gratuity Accrued (BDT)'];
  const body = payrolls.map((p) => [
    p.user?.name || 'N/A',
    p.user?.id || '',
    p.month,
    p.year,
    p.baseSalary ?? p.user?.baseSalary ?? 0,
    p.gratuityAccrued ?? 0,
  ]);
  return [header, ...body];
}

export function toFestivalBonusCsv(festivalBonuses: FestivalBonusCsvRow[]): (string | number)[][] {
  const header = ['Employee', 'Employee ID', 'Year', 'Occasion', 'Basic Salary (BDT)', 'Festival Bonus (BDT)', 'Status'];
  const body = festivalBonuses.map((f) => [
    f.user?.name || 'N/A',
    f.user?.id || '',
    f.year,
    f.occasion,
    f.baseSalarySnapshot ?? 0,
    f.amount ?? 0,
    f.status,
  ]);
  return [header, ...body];
}
