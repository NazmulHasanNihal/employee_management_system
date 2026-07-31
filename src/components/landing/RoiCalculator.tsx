"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, TrendingUp, Clock, DollarSign } from "lucide-react";

export default function RoiCalculator() {
  const [employees, setEmployees] = useState<number>(40);
  const [hourlyRate, setHourlyRate] = useState<number>(40);

  // Formulas
  // Estimated HR/Payroll admin hours wasted per employee per month in manual setup: ~1.2 hrs
  // OpsHub reduces this time by 80% => saves ~0.96 hrs per employee / month
  const hoursSavedPerMonth = Math.round(employees * 0.95);
  const monthlySavings = Math.round(hoursSavedPerMonth * hourlyRate);
  const annualSavings = monthlySavings * 12;

  return (
    <section id="calculator" className="py-24 bg-[var(--bg-hover)] relative overflow-hidden border-t border-[var(--border-hairline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold uppercase tracking-wider mb-4">
            <Calculator className="w-3.5 h-3.5" />
            Interactive ROI Calculator
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            Calculate How Much Time & Money OpsHub Saves You
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            Adjust your company headcount and average HR rate to calculate your estimated annual savings.
          </p>
        </div>

        {/* Calculator Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[var(--bg-app)] border border-[var(--border-hairline)] rounded-3xl p-8 sm:p-12 shadow-md backdrop-blur-md">
          {/* Sliders Input Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Employee Count Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <span>Number of Employees:</span>
                </label>
                <span className="px-3.5 py-1 rounded-xl bg-[var(--sky-soft)] text-[var(--sky)] font-extrabold text-lg border border-[var(--sky)]/30">
                  {employees} Staff
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={employees}
                onChange={(e) => setEmployees(parseInt(e.target.value))}
                className="w-full h-3 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--brand)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                <span>5 Employees</span>
                <span>150</span>
                <span>300+ Employees</span>
              </div>
            </div>

            {/* HR Hourly Rate Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <span>Avg HR / Admin Hourly Rate ($):</span>
                </label>
                <span className="px-3.5 py-1 rounded-xl bg-[var(--sky-soft)] text-[var(--sky)] font-extrabold text-lg border border-[var(--sky)]/30">
                  ${hourlyRate} / hr
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                className="w-full h-3 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--brand)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                <span>$20/hr</span>
                <span>$60/hr</span>
                <span>$100/hr</span>
              </div>
            </div>

            {/* Breakdown Note */}
            <div className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] space-y-1">
              <p className="font-semibold text-[var(--text-main)]">💡 Calculation Logic:</p>
              <p>Based on automated shift roster generation, 1-click payroll processing, self-service leave, and digital expense approvals replacing manual spreadsheets.</p>
            </div>
          </div>

          {/* Results Output Card Column */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[var(--bg-hover)] via-[var(--bg-panel)] to-[var(--bg-hover)] border border-[var(--brand)]/30 rounded-2xl p-8 text-center flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-bold text-[var(--sky)] uppercase tracking-widest block mb-2">
                Estimated Annual Savings
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--sky)] to-[var(--brand)] my-3">
                ${annualSavings.toLocaleString()}
              </div>
              <p className="text-xs text-[var(--text-muted)]">Total yearly ROI from switching to OpsHub</p>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-[var(--border-hairline)]">
                <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)] shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--sky)]" />
                    Time Saved
                  </div>
                  <span className="font-bold text-[var(--text-main)] text-base">{hoursSavedPerMonth} hrs</span>
                  <span className="text-[10px] text-[var(--text-muted)] block">per month</span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)] shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] text-xs mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-[var(--emerald)]" />
                    Monthly Value
                  </div>
                  <span className="font-bold text-[var(--text-main)] text-base">${monthlySavings.toLocaleString()}</span>
                  <span className="text-[10px] text-[var(--text-muted)] block">per month</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/login?signup=true"
                className="w-full btn-primary py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                Claim Your Savings Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
