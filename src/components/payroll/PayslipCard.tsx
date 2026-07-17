"use client";

import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PayslipCardProps {
  pay: any;
  isAdmin: boolean;
  currentUser: any;
}

interface BreakdownEntry {
  head: string;
  amount: number;
}

export function PayslipCard({ pay, isAdmin, currentUser }: PayslipCardProps) {
  const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', BDT: '৳' };
  const sym = CURRENCY_SYMBOLS[pay.currency || 'BDT'] || '৳';

  const earnings: BreakdownEntry[] = Array.isArray(pay.earningsBreakdown) ? pay.earningsBreakdown : [];
  const deductions: BreakdownEntry[] = Array.isArray(pay.deductionsBreakdown) ? pay.deductionsBreakdown : [];

  const totalEarnings = earnings.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalDeductions = deductions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const net = pay.netPay ?? pay.totalAmount ?? 0;

  const printPayslip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const earningsHtml = earnings.map(e => `
      <tr><td>${e.head}</td><td>${sym}${(e.amount || 0).toFixed(2)}</td></tr>
    `).join('');

    const deductionsHtml = deductions.map(d => `
      <tr><td>${d.head}</td><td>${sym}${(d.amount || 0).toFixed(2)}</td></tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Payslip - ${pay.month}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; text-transform: uppercase; letter-spacing: 2px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .details div { width: 48%; border: 1px solid #ccc; padding: 15px; }
            .table-container { margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 12px; text-align: left; }
            th { background: #f5f5f5; text-transform: uppercase; font-size: 12px; }
            .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; border-top: 2px solid #333; padding-top: 20px; }
            .footer { text-align: center; font-size: 10px; color: #777; margin-top: 50px; border-top: 1px dashed #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EMS PAYROLL</h1>
            <p>PAYSLIP: ${pay.month} ${pay.year}</p>
          </div>

          <div class="details">
            <div>
              <strong>EMPLOYEE DETAILS</strong><br><br>
              Name: ${pay.user?.name || currentUser?.name}<br>
              Email: ${pay.user?.email || currentUser?.email}<br>
              Role: ${pay.user?.role || currentUser?.role}
            </div>
            <div>
              <strong>PAYMENT DETAILS</strong><br><br>
              Date: ${new Date(pay.createdAt).toLocaleDateString()}<br>
              Status: ${pay.status.toUpperCase()}<br>
              Reference: PAY-${(pay.id || '').substring(0, 8).toUpperCase()}<br>
              Base Salary: ${sym}${(pay.baseSalary || 0).toFixed(2)}
            </div>
          </div>

          <div style="display:flex; gap: 20px;">
            <div class="table-container" style="flex:1">
              <table>
                <tr><th colspan="2">EARNINGS</th></tr>
                ${earningsHtml || '<tr><td colspan="2">No earnings</td></tr>'}
                <tr><th>Total Earnings</th><th>${sym}${totalEarnings.toFixed(2)}</th></tr>
              </table>
            </div>
            <div class="table-container" style="flex:1">
              <table>
                <tr><th colspan="2">DEDUCTIONS</th></tr>
                ${deductionsHtml || '<tr><td colspan="2">No deductions</td></tr>'}
                <tr><th>Total Deductions</th><th>${sym}${totalDeductions.toFixed(2)}</th></tr>
              </table>
            </div>
          </div>

          <div class="table-container" style="background: #f9f9f9; padding: 15px; border: 1px solid #ccc;">
            <strong>ATTENDANCE METRICS</strong>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Overtime Hours: ${pay.overtimeHours?.toFixed(1) || 0} |
              Night Hours: ${pay.nightHours?.toFixed(1) || 0} |
              Late Days: ${pay.lateDays || 0}
            </p>
          </div>

          <div class="total">NET PAY: ${sym}${net.toFixed(2)}</div>

          <div class="footer">
            This is a computer generated document. No signature is required.<br>
            Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <Card className="bg-black/40 border-white/10 hover:border-[var(--ledger-blue)]/50 transition-colors shadow-lg group">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[var(--ledger-blue)]/50 transition-colors">
              <FileText className="text-[var(--ledger-blue)]" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black font-mono text-white uppercase tracking-widest">{pay.month}</h3>
                <Badge variant="outline" className={`font-mono text-[10px] h-5 rounded uppercase tracking-widest ${pay.status === 'PROCESSED' || pay.status === 'Disbursed' ? 'text-[var(--verify-green)] border-[var(--verify-green)]' : 'text-[var(--signal-amber)] border-[var(--signal-amber)]'}`}>
                  {pay.status}
                </Badge>
              </div>
              <p className="text-sm font-mono text-[var(--text-muted)]">
                Generated: {new Date(pay.createdAt).toLocaleDateString()}
              </p>
              {isAdmin && pay.user && (
                <p className="text-xs font-sans text-white/50 mt-1">Employee: {pay.user.name}</p>
              )}
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col justify-between h-full">
            <div>
              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Net Transfer</p>
              <p className="text-2xl font-bold font-mono text-[var(--verify-green)]">
                {sym}{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button onClick={printPayslip} variant="outline" size="sm" className="mt-4 border-white/10 text-white hover:bg-white/10 font-mono text-xs uppercase tracking-widest h-8 w-fit md:ml-auto">
              <Printer size={14} className="mr-2" /> Download Slip
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Earnings (+)</p>
            <p className="text-sm font-mono text-[var(--ledger-blue)]">{sym}{totalEarnings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-[var(--alert-red)]/70 uppercase tracking-widest mb-1">Deductions (-)</p>
            <p className="text-sm font-mono text-[var(--alert-red)]">{sym}{totalDeductions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-[var(--signal-amber)]/70 uppercase tracking-widest mb-1">Overtime Hrs</p>
            <p className="text-sm font-mono text-[var(--signal-amber)]">{pay.overtimeHours?.toFixed(1) || 0}h</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Night Hrs</p>
            <p className="text-sm font-mono text-white/70">{pay.nightHours?.toFixed(1) || 0}h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
