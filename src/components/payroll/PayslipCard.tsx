"use client";

import React, { useState } from 'react';
import { FileText, Printer, Building2, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { T } from "@/components/Translate";

interface PayslipCardProps {
  pay: any;
  isAdmin: boolean;
  currentUser: any;
}

interface BreakdownEntry {
  head: string;
  amount: number;
}

/** Convert numbers to English words representation for currency amounts */
function numberToWordsTaka(amount: number): string {
  const num = Math.floor(amount);
  if (num === 0) return 'Zero Taka Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + (n % 10 !== 0 ? units[n % 10] + ' ' : '');
    return units[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertLessThanThousand(n % 100) : '');
  }

  let words = '';
  let n = num;

  if (Math.floor(n / 10000000) > 0) {
    words += convertLessThanThousand(Math.floor(n / 10000000)) + 'Crore ';
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += convertLessThanThousand(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += convertLessThanThousand(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    words += convertLessThanThousand(n);
  }

  return (words.trim() + ' Taka Only');
}

export function PayslipCard({ pay, isAdmin, currentUser }: PayslipCardProps) {
  const [showModal, setShowModal] = useState(false);

  const sym = '৳';
  const grossSalary = pay.totalAmount || pay.baseSalary || 50000;
  const basicSalary = Math.round(grossSalary * 0.5);
  const hra = Math.round(basicSalary * 0.5);
  const medical = Math.round(basicSalary * 0.1);
  const conveyance = 3000;
  const festivalBonus = pay.festivalBonus || 0;

  const pfDeduction = pay.providentFund || Math.round(basicSalary * 0.1);
  const taxDeduction = pay.tax || 0;
  const penaltyDeduction = pay.lateDays ? pay.lateDays * 500 : 0;

  const totalEarnings = basicSalary + hra + medical + conveyance + festivalBonus;
  const totalDeductions = pfDeduction + taxDeduction + penaltyDeduction;
  const netPayable = pay.netPay ?? (totalEarnings - totalDeductions);

  const wordsInTaka = numberToWordsTaka(netPayable);

  const handlePrint = () => {
    const printContent = document.getElementById(`printable-payslip-${pay.id}`);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip_${pay.month}_${pay.year}_${pay.user?.name || 'Employee'}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #1f2937; line-height: 1.5; }
            .payslip-box { border: 2px solid #374151; padding: 30px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
            .header-table { width: 100%; border-bottom: 2px solid #111827; padding-bottom: 15px; margin-bottom: 20px; }
            .company-title { font-size: 22px; font-weight: bold; text-transform: uppercase; color: #111827; }
            .sub-title { font-size: 12px; color: #4b5563; }
            .meta-grid { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
            .meta-grid td { padding: 6px 10px; border: 1px solid #e5e7eb; font-size: 13px; }
            .meta-label { font-weight: bold; background-color: #f9fafb; width: 25%; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; padding: 8px; background-color: #f3f4f6; border: 1px solid #d1d5db; margin-top: 15px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; text-align: left; }
            .items-table th { background-color: #f9fafb; font-weight: bold; }
            .text-right { text-align: right; }
            .net-box { border: 2px solid #059669; background-color: #ecfdf5; padding: 15px; border-radius: 6px; text-align: right; margin-top: 20px; }
            .net-amount { font-size: 20px; font-weight: bold; color: #059669; }
            .footer-note { font-size: 11px; text-align: center; color: #6b7280; margin-top: 40px; border-top: 1px dashed #9ca3af; padding-top: 15px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <Card
        className="group transition-all hover:border-[var(--brand)]/40 hover:shadow-lg cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)] shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[var(--text-main)]">{pay.month} {pay.year}</h3>
                  <Badge variant={pay.status === 'PROCESSED' || pay.status === 'Disbursed' ? 'emerald' : 'amber'}>
                    {pay.status}
                  </Badge>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-bold text-[var(--text-main)]">
                    {pay.user?.name || currentUser?.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    {pay.user?.designation || 'Staff'} • {pay.user?.department || 'Operations'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Net Payable</T></p>
              <p className="text-xl font-extrabold text-[var(--emerald)]">
                {sym}{netPayable.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3 text-center text-xs">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Gross Earnings</T></p>
              <p className="font-bold text-[var(--brand)]">{sym}{totalEarnings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Deductions</T></p>
              <p className="font-bold text-[var(--rose)]">{sym}{totalDeductions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>PF Match</T></p>
              <p className="font-bold text-[var(--text-main)]">{sym}{pfDeduction.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl border-[var(--border-hairline)] text-xs font-semibold"
            >
              <CheckCircle2 size={14} className="mr-1.5 text-[var(--emerald)]" /> {/* @ts-ignore */}<T>View Detailed Slip</T>
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handlePrint();
              }}
              variant="primary"
              size="sm"
              className="flex-1 rounded-xl text-xs font-semibold"
            >
              <Printer size={14} className="mr-1.5" /> {/* @ts-ignore */}<T>Print / Save PDF</T></Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden Printable Container */}
      <div id={`printable-payslip-${pay.id}`} className="hidden opacity-0 invisible absolute -z-50 pointer-events-none w-0 h-0 overflow-hidden" aria-hidden="true">
        <div className="payslip-box">
          <table className="header-table">
            <tr>
              <td>
                <div className="company-title">{/* @ts-ignore */}<T>Enterprise Resource & Relationship Systems</T></div>
                <div className="sub-title">{/* @ts-ignore */}<T>HQ Tower, Level 12, Gulshan Avenue, Dhaka-1212, Bangladesh</T></div>
                <div className="sub-title">{/* @ts-ignore */}<T>Tax Reg / TIN: 48920194819 | BD Labour Act Compliant</T></div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{/* @ts-ignore */}<T>PAYSLIP STATEMENT</T></div>
                <div style={{ fontSize: '12px', color: '#4b5563' }}>{/* @ts-ignore */}<T>Period:</T>{pay.month} {pay.year}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{/* @ts-ignore */}<T>Ref: PAY-</T>{pay.id.substring(0, 8).toUpperCase()}</div>
              </td>
            </tr>
          </table>

          <table className="meta-grid">
            <tr>
              <td className="meta-label">{/* @ts-ignore */}<T>Employee Name</T></td>
              <td>{pay.user?.name || currentUser?.name}</td>
              <td className="meta-label">{/* @ts-ignore */}<T>Employee ID</T></td>
              <td>{/* @ts-ignore */}<T>EMP-</T>{pay.userId.substring(0, 6).toUpperCase()}</td>
            </tr>
            <tr>
              <td className="meta-label">{/* @ts-ignore */}<T>Department</T></td>
              <td>{pay.user?.department || 'Operations'}</td>
              <td className="meta-label">{/* @ts-ignore */}<T>Designation</T></td>
              <td>{pay.user?.designation || 'Staff Member'}</td>
            </tr>
            <tr>
              <td className="meta-label">{/* @ts-ignore */}<T>Payment Method</T></td>
              <td>{/* @ts-ignore */}<T>bKash / Bank ACH Transfer</T></td>
              <td className="meta-label">{/* @ts-ignore */}<T>Disbursement Date</T></td>
              <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
            </tr>
          </table>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div className="section-title">{/* @ts-ignore */}<T>Earnings (+)</T></div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>{/* @ts-ignore */}<T>Component</T></th>
                    <th className="text-right">{/* @ts-ignore */}<T>Amount (</T>{sym})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>{/* @ts-ignore */}<T>Basic Salary (50%)</T></td><td className="text-right">{basicSalary.toLocaleString()}</td></tr>
                  <tr><td>{/* @ts-ignore */}<T>House Rent Allowance (HRA)</T></td><td className="text-right">{hra.toLocaleString()}</td></tr>
                  <tr><td>{/* @ts-ignore */}<T>Medical Allowance</T></td><td className="text-right">{medical.toLocaleString()}</td></tr>
                  <tr><td>{/* @ts-ignore */}<T>Conveyance Allowance</T></td><td className="text-right">{conveyance.toLocaleString()}</td></tr>
                  {festivalBonus > 0 && <tr><td>{/* @ts-ignore */}<T>Festival Bonus</T></td><td className="text-right">{festivalBonus.toLocaleString()}</td></tr>}
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                    <td>{/* @ts-ignore */}<T>Total Gross Earnings</T></td>
                    <td className="text-right">{totalEarnings.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ flex: 1 }}>
              <div className="section-title">{/* @ts-ignore */}<T>Deductions (-)</T></div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>{/* @ts-ignore */}<T>Component</T></th>
                    <th className="text-right">{/* @ts-ignore */}<T>Amount (</T>{sym})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>{/* @ts-ignore */}<T>Provident Fund (10%)</T></td><td className="text-right">{pfDeduction.toLocaleString()}</td></tr>
                  <tr><td>{/* @ts-ignore */}<T>Tax Deducted at Source (TDS)</T></td><td className="text-right">{taxDeduction.toLocaleString()}</td></tr>
                  {penaltyDeduction > 0 && <tr><td>{/* @ts-ignore */}<T>Lateness Fine</T></td><td className="text-right">{penaltyDeduction.toLocaleString()}</td></tr>}
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                    <td>{/* @ts-ignore */}<T>Total Deductions</T></td>
                    <td className="text-right">{totalDeductions.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="net-box">
            <div style={{ fontSize: '12px', color: '#4b5563' }}>{/* @ts-ignore */}<T>Net Salary Transfer</T></div>
            <div className="net-amount">{sym} {netPayable.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#047857', fontStyle: 'italic', marginTop: '4px' }}>
              {/* @ts-ignore */}<T>Amount in words:</T><strong>{wordsInTaka}</strong>
            </div>
          </div>

          <div className="footer-note">
            {/* @ts-ignore */}<T>This is a system-generated official payslip compliant with Bangladesh Labour Act 2006 (and 2013 amendments).</T><br />
            {/* @ts-ignore */}<T>Confidential · Enterprise Employee Management System</T></div>
        </div>
      </div>

      {/* Interactive Full-Screen View */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-app)] animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-3 md:px-8 shadow-sm z-10">
            <Button onClick={() => setShowModal(false)} variant="ghost" size="sm" className="h-8 px-3 text-[var(--text-main)] hover:bg-[var(--bg-hover)]">
              <span className="text-lg leading-none mr-2">←</span> Back
            </Button>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[var(--brand)] hidden sm:block" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">{pay.month} {pay.year} Payslip</h3>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="primary" size="sm" className="h-8 px-4 rounded-xl">
                <Printer size={14} className="mr-2" /> Print PDF
              </Button>
            </div>
          </div>

          {/* Scrollable Document Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex justify-center items-start">
            <div className="w-full max-w-2xl rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)] text-white shadow-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">{/* @ts-ignore */}<T>Official Statement</T></h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{pay.month} {pay.year}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={pay.status === 'PROCESSED' || pay.status === 'Disbursed' ? 'emerald' : 'amber'} className="mb-1 text-[10px]">
                    {pay.status}
                  </Badge>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">ID: PAY-{pay.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider font-bold">{/* @ts-ignore */}<T>Employee Profile</T></p>
                  <p className="font-bold text-[var(--text-main)] text-base">{pay.user?.name || currentUser?.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{pay.user?.designation || 'Staff'} • {pay.user?.department || 'Operations'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider font-bold">{/* @ts-ignore */}<T>Disbursement</T></p>
                  <p className="font-bold text-[var(--emerald)]">{/* @ts-ignore */}<T>bKash / Bank ACH</T></p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(pay.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3">
                  <p className="text-[11px] font-bold uppercase text-[var(--brand)] border-b border-[var(--border-hairline)] pb-1.5">{/* @ts-ignore */}<T>Gross Earnings (+)</T></p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>{/* @ts-ignore */}<T>Basic Salary (50%)</T></span><span className="font-semibold">{sym}{basicSalary.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>{/* @ts-ignore */}<T>House Rent (HRA)</T></span><span className="font-semibold">{sym}{hra.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>{/* @ts-ignore */}<T>Medical Allowance</T></span><span className="font-semibold">{sym}{medical.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>{/* @ts-ignore */}<T>Conveyance</T></span><span className="font-semibold">{sym}{conveyance.toLocaleString()}</span></div>
                    {festivalBonus > 0 && <div className="flex justify-between text-[var(--emerald)]"><span>{/* @ts-ignore */}<T>Festival Bonus</T></span><span className="font-semibold">{sym}{festivalBonus.toLocaleString()}</span></div>}
                    <div className="flex justify-between border-t border-[var(--border-hairline)] pt-1.5 font-bold text-[var(--brand)]"><span>{/* @ts-ignore */}<T>Total Earnings</T></span><span>{sym}{totalEarnings.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3">
                  <p className="text-[11px] font-bold uppercase text-[var(--rose)] border-b border-[var(--border-hairline)] pb-1.5">{/* @ts-ignore */}<T>Statutory Deductions (-)</T></p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>{/* @ts-ignore */}<T>Provident Fund (10%)</T></span><span className="font-semibold">{sym}{pfDeduction.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>{/* @ts-ignore */}<T>Income Tax (TDS)</T></span><span className="font-semibold">{sym}{taxDeduction.toLocaleString()}</span></div>
                    {penaltyDeduction > 0 && <div className="flex justify-between text-[var(--rose)]"><span>{/* @ts-ignore */}<T>Lateness Fine</T></span><span className="font-semibold">{sym}{penaltyDeduction.toLocaleString()}</span></div>}
                    <div className="flex justify-between border-t border-[var(--border-hairline)] pt-1.5 font-bold text-[var(--rose)]"><span>{/* @ts-ignore */}<T>Total Deductions</T></span><span>{sym}{totalDeductions.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Net Amount Box */}
              <div className="rounded-xl border border-[var(--emerald)]/40 bg-[var(--emerald-soft)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--emerald)] tracking-wider">{/* @ts-ignore */}<T>Net Amount Payable</T></p>
                  <p className="text-[12px] italic text-[var(--text-muted)] font-medium mt-0.5">{wordsInTaka}</p>
                </div>
                <p className="text-2xl font-extrabold text-[var(--emerald)]">{sym} {netPayable.toLocaleString()}</p>
              </div>

              <div className="pt-4 flex justify-center">
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  This is a system-generated official payslip compliant with Bangladesh Labour Act 2006 (and 2013 amendments).<br/>
                  Confidential · Enterprise Employee Management System
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
