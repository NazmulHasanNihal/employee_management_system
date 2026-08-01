import Link from "next/link";
import { Zap, ShieldCheck, Lock, Globe, Mail } from "lucide-react";
import { T } from "@/components/Translate";

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
                {/* @ts-ignore */}<T>OpsHub</T><span className="text-[var(--brand)]">.</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              {/* @ts-ignore */}<T>The modern workforce & HR operating system for scaling companies. Automate payroll, shift rosters, attendance, compliance, and employee experience in one seamless SaaS platform.</T></p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Lock className="w-3.5 h-3.5 text-[var(--sky)]" />
                {/* @ts-ignore */}<T>256-Bit SSL Encrypted</T></div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--emerald)]" />
                {/* @ts-ignore */}<T>SOC-2 & GDPR Ready</T></div>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">{/* @ts-ignore */}<T>Product</T></h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Shift Scheduling</T></Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>1-Click Payroll Engine</T></Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Festival Bonus Module</T></Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Attendance & Geofencing</T></Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>DEI & Compliance Auditor</T></Link></li>
              <li><Link href="#features" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>IT Asset Management</T></Link></li>
            </ul>
          </div>

          {/* Column 3: Solutions & Compare */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">{/* @ts-ignore */}<T>Compare</T></h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#comparison" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>OpsHub vs. Workday</T></Link></li>
              <li><Link href="#comparison" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>OpsHub vs. BambooHR</T></Link></li>
              <li><Link href="#comparison" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>OpsHub vs. Excel Spreadsheets</T></Link></li>
              <li><Link href="#why-opshub" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Why Switch to OpsHub</T></Link></li>
              <li><Link href="#calculator" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>ROI Calculator</T></Link></li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4">{/* @ts-ignore */}<T>Company</T></h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#about" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>About Us</T></Link></li>
              <li><Link href="#pricing" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Pricing Plans</T></Link></li>
              <li><Link href="/login" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Employee Portal Login</T></Link></li>
              <li><Link href="#faq" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Help Center & FAQ</T></Link></li>
              <li><Link href="#contact" className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>Contact Support</T></Link></li>
              <li><span className="text-[var(--text-muted)] opacity-50 cursor-not-allowed">{/* @ts-ignore */}<T>Privacy Policy</T></span></li>
              <li><span className="text-[var(--text-muted)] opacity-50 cursor-not-allowed">{/* @ts-ignore */}<T>Terms of Service</T></span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} {/* @ts-ignore */}<T>OpsHub Inc. All rights reserved.</T></p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[var(--text-main)] transition-colors">{/* @ts-ignore */}<T>System Status: All Systems Operational 🟢</T></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
