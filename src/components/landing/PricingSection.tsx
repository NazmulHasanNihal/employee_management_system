"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      tagline: "Perfect for small teams & growing startups.",
      monthlyPrice: 29,
      annualPrice: 23,
      popular: false,
      ctaText: "Start 14-Day Free Trial",
      ctaHref: "/login?signup=true&plan=starter",
      features: [
        "Up to 25 Employees",
        "Attendance & Shift Scheduling",
        "Leave Management & Approvals",
        "Monthly Payroll & Payslip Export",
        "Employee Self-Service Portal",
        "Standard Email Support",
      ],
    },
    {
      name: "Pro",
      tagline: "Ideal for scaling companies needing automation.",
      monthlyPrice: 79,
      annualPrice: 63,
      popular: true,
      badgeText: "MOST POPULAR",
      ctaText: "Start Free Trial (Pro)",
      ctaHref: "/login?signup=true&plan=pro",
      features: [
        "Up to 100 Employees",
        "Everything in Starter, plus:",
        "Automated Festival Bonus Engine",
        "DEI & Compliance Auditor Vault",
        "IT Asset Tracking & Helpdesk",
        "Whistleblower Anonymous Channel",
        "Performance & Quarterly Reviews",
        "Priority 24/7 Live Support",
      ],
    },
    {
      name: "Enterprise",
      tagline: "For large organizations requiring custom SLAs.",
      monthlyPrice: 199,
      annualPrice: 159,
      popular: false,
      ctaText: "Contact Sales",
      ctaHref: "/login?signup=true&plan=enterprise",
      features: [
        "Unlimited Employees & Branches",
        "Everything in Pro, plus:",
        "Custom IP Allowlist Security",
        "Multi-Branch Organizational Hierarchy",
        "Dedicated Customer Success Manager",
        "Custom Audit Log Data Exports",
        "99.99% Guaranteed SLA",
        "Custom SSO & SAML Integration",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-900/80 relative overflow-hidden border-t border-slate-800">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent SaaS Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, Predictable Plans for Every Stage
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            No hidden setup fees. No per-employee surprise gouging. Cancel anytime.
          </p>

          {/* Billing Frequency Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual Billing
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-16">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={idx}
                className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-md transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 lg:-translate-y-2"
                    : "bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-xl"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-xs font-black tracking-wider uppercase shadow-lg">
                      {plan.badgeText}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.tagline}</p>
                </div>

                {/* Price Box */}
                <div className="mb-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">${price}</span>
                    <span className="text-sm font-medium text-slate-400">/ month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAnnual ? "Billed annually ($" + price * 12 + "/yr)" : "Billed monthly"}
                  </p>
                </div>

                {/* Feature List */}
                <div className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular ? "bg-cyan-500/20 text-cyan-400" : "bg-indigo-500/20 text-indigo-400"
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className={`${fIdx === 0 ? "font-semibold text-slate-100" : "text-slate-300"}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-all duration-200 ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-400 via-indigo-500 to-indigo-600 text-white hover:opacity-95 shadow-lg shadow-cyan-500/25"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  {plan.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="max-w-3xl mx-auto text-center bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">14-Day Risk-Free Trial</h4>
              <p className="text-xs text-slate-400">Full feature access. No credit card required to start.</p>
            </div>
          </div>
          <Link
            href="/login?signup=true"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 shrink-0"
          >
            Need a custom enterprise demo? Contact Sales &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
