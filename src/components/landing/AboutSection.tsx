"use client";

import { Target, Lightbulb, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-[var(--bg-panel)] relative overflow-hidden border-t border-[var(--border-hairline)]">
      {/* Background accents */}
      <div className="absolute -left-40 top-20 w-80 h-80 bg-[var(--brand)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -right-40 bottom-20 w-80 h-80 bg-[var(--sky)]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold uppercase tracking-wider mb-6">
              Our Story
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight leading-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--sky)]">People</span>, <br />
              Powered by Data.
            </h2>
            <p className="mt-6 text-lg text-[var(--text-muted)] leading-relaxed">
              At OpsHub, we believe that managing your workforce shouldn't be a nightmare of spreadsheets, lost time cards, and disconnected tools. Our mission is to democratize enterprise-grade HR operations for growing businesses.
            </p>
            <p className="mt-4 text-lg text-[var(--text-muted)] leading-relaxed">
              We started by fixing the broken payroll and attendance systems we experienced first-hand, evolving into a unified platform that HR leaders and operational teams genuinely love using every day.
            </p>
            
            <div className="mt-10">
              <Link
                href="/login?signup=true"
                className="inline-flex items-center gap-2 text-[var(--brand)] font-semibold hover:text-[var(--brand-strong)] transition-colors group"
              >
                Join our journey
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Content / Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="ledger-card p-8 rounded-2xl flex flex-col gap-4 shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-[var(--emerald-soft)] text-[var(--emerald)] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Mission</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                To eliminate manual HR busywork so leaders can focus on building incredible workplace cultures.
              </p>
            </div>

            <div className="ledger-card p-8 rounded-2xl flex flex-col gap-4 shadow-sm hover:-translate-y-1 transition-transform duration-300 sm:mt-12">
              <div className="w-12 h-12 rounded-xl bg-[var(--amber-soft)] text-[var(--amber)] flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Innovation</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Continuously delivering smart automation, from 1-click payroll to intelligent shift rosters.
              </p>
            </div>

            <div className="ledger-card p-8 rounded-2xl flex flex-col gap-4 shadow-sm hover:-translate-y-1 transition-transform duration-300 sm:-mt-12">
              <div className="w-12 h-12 rounded-xl bg-[var(--sky-soft)] text-[var(--sky)] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Community</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Building a supportive network of modern operators who put their people first.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
