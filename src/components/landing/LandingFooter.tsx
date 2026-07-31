import Link from "next/link";
import { Zap, ShieldCheck, Lock, Globe, Mail } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-[var(--bg-panel)] border-t border-[var(--border-hairline)] text-[var(--text-muted)] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Column 1: Brand & Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--brand-strong)] via-[var(--brand)] to-[var(--sky)] flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-extrabold text-xl text-[var(--text-main)] tracking-tight">
                OpsHub<span className="text-[var(--brand)]">.</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              The modern workforce & HR operating system for scaling companies. Automate payroll, shift rosters, attendance, compliance, and employee experience in one seamless SaaS platform.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Lock className="w-3.5 h-3.5 text-[var(--sky)]" />
                256-Bit SSL Encrypted
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--emerald)]" />
                SOC-2 & GDPR Ready
              </div>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">Shift Scheduling</Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">1-Click Payroll Engine</Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">Festival Bonus Module</Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">Attendance & Geofencing</Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">DEI & Compliance Auditor</Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">IT Asset Management</Link></li>
            </ul>
          </div>

          {/* Column 3: Solutions & Compare */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">Compare</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#comparison" className="hover:text-[var(--text-main)] transition-colors">OpsHub vs. Workday</Link></li>
              <li><Link href="#comparison" className="hover:text-[var(--text-main)] transition-colors">OpsHub vs. BambooHR</Link></li>
              <li><Link href="#comparison" className="hover:text-[var(--text-main)] transition-colors">OpsHub vs. Excel Spreadsheets</Link></li>
              <li><Link href="#why-opshub" className="hover:text-[var(--text-main)] transition-colors">Why Switch to OpsHub</Link></li>
              <li><Link href="#calculator" className="hover:text-[var(--text-main)] transition-colors">ROI Calculator</Link></li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#about" className="hover:text-[var(--text-main)] transition-colors">About Us</Link></li>
              <li><Link href="#pricing" className="hover:text-[var(--text-main)] transition-colors">Pricing Plans</Link></li>
              <li><Link href="/login" className="hover:text-[var(--text-main)] transition-colors">Employee Portal Login</Link></li>
              <li><Link href="#faq" className="hover:text-[var(--text-main)] transition-colors">Help Center & FAQ</Link></li>
              <li><Link href="#contact" className="hover:text-[var(--text-main)] transition-colors">Contact Support</Link></li>
              <li><span className="text-[var(--text-muted)] opacity-50 cursor-not-allowed">Privacy Policy</span></li>
              <li><span className="text-[var(--text-muted)] opacity-50 cursor-not-allowed">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} OpsHub Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[var(--text-main)] transition-colors">System Status: All Systems Operational 🟢</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
