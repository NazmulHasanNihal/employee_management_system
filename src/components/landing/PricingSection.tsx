"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { T } from "@/components/Translate";

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      tagline: "Perfect for small teams & growing startups.",
      monthlyPrice: 2900,
      annualPrice: 2300,
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
      monthlyPrice: 7900,
      annualPrice: 6300,
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
      monthlyPrice: 19900,
      annualPrice: 15900,
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
    <section id="pricing" className="py-24 bg-[var(--bg-app)] relative overflow-hidden border-t border-[var(--border-hairline)]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--brand)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--emerald-soft)] border border-[var(--emerald)]/20 text-[var(--emerald)] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {/* @ts-ignore */}<T>Transparent SaaS Pricing</T></div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            {/* @ts-ignore */}<T>Simple, Predictable Plans for Every Stage</T></h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>No hidden setup fees. No per-employee surprise gouging. Cancel anytime.</T></p>

          {/* Billing Frequency Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-hairline)]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-[var(--bg-hover)] text-[var(--text-main)] shadow-sm border border-[var(--border-hairline)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"
              }`}
            >
              {/* @ts-ignore */}<T>Monthly Billing</T></button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-[var(--brand)] text-white shadow-sm border border-transparent"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"
              }`}
            >
              {/* @ts-ignore */}<T>Annual Billing</T><span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${isAnnual ? "bg-white text-[var(--brand)]" : "bg-[var(--emerald-soft)] text-[var(--emerald)]"}`}>
                {/* @ts-ignore */}<T>Save 20%</T></span>
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
                className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-md transition-all duration-300 bg-card text-card-foreground border border-border ${
                  plan.popular
                    ? "border-[var(--brand)] shadow-lg shadow-[var(--brand)]/20 lg:-translate-y-2 bg-[var(--bg-app)]"
                    : "shadow-sm border-[var(--border-hairline)]"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--sky)] to-[var(--brand)] text-white text-xs font-black tracking-wider uppercase shadow-md">
                      {plan.badgeText}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[var(--text-main)]">{plan.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 min-h-[32px]">{plan.tagline}</p>
                </div>

                {/* Price Box */}
                <div className="mb-8 p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-hairline)]">
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-[var(--text-main)]">৳{price.toLocaleString('en-IN')}</span>
                    <span className="text-[var(--text-muted)] font-medium">/mo</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)] font-medium">
                    {isAnnual ? "Billed annually (৳" + (price * 12).toLocaleString('en-IN') + "/yr)" : "Billed monthly"}
                  </p>
                </div>

                {/* Feature List */}
                <div className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular ? "bg-[var(--brand-soft)]/20 text-[var(--brand)]" : "bg-[var(--sky-soft)] text-[var(--sky)]"
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className={`${fIdx === 0 ? "font-semibold text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>
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
                      ? "btn-primary"
                      : "btn-secondary"
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
        <div className="max-w-3xl mx-auto text-center bg-[var(--bg-panel)] border border-[var(--border-hairline)] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--emerald-soft)] border border-[var(--emerald)]/20 flex items-center justify-center text-[var(--emerald)] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-main)]">{/* @ts-ignore */}<T>14-Day Risk-Free Trial</T></h4>
              <p className="text-xs text-[var(--text-muted)]">{/* @ts-ignore */}<T>Full feature access. No credit card required to start.</T></p>
            </div>
          </div>
          <Link
            href="/login?signup=true"
            className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] underline underline-offset-4 shrink-0"
          >
            {/* @ts-ignore */}<T>Need a custom enterprise demo? Contact Sales &rarr;</T></Link>
        </div>
      </div>
    </section>
  );
}
