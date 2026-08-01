import { Clock, ShieldCheck, DollarSign, Users, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export default function ValuePropSection() {
  const painPoints = [
    { title: "Excel & Spreadsheet Chaos", desc: "Version conflicts, lost formulas, and manual data copy-pasting standard in legacy routines." },
    { title: "Costly Payroll Errors", desc: "Overpayments, missed festival bonuses, and tax calculation mistakes costing thousands annually." },
    { title: "Compliance & Audit Risk", desc: "No central audit trail for leave approvals, expense claims, or employee policy sign-offs." },
    { title: "Fragmented Point Solutions", desc: "Paying for 5 different software tools that don't talk to each other." },
  ];

  const valuePillars = [
    {
      icon: Clock,
      color: "from-[var(--sky)] to-[var(--brand)]",
      badge: "85% Time Saved",
      title: "Automated Time & Attendance",
      desc: "Smart shift scheduling, geofenced clock-ins, leave balance tracking, and real-time overtime calculations in one unified dashboard.",
    },
    {
      icon: DollarSign,
      color: "from-[var(--emerald)] to-[var(--emerald-soft)]",
      badge: "Zero Payroll Errors",
      title: "1-Click Payroll & Bonus Engine",
      desc: "Run accurate monthly payouts, festival bonuses, tax withholdings, and instant payslip distribution directly to employee portals.",
    },
    {
      icon: ShieldCheck,
      color: "from-[var(--amber)] to-[var(--amber-soft)]",
      badge: "Bank-Grade Compliance",
      title: "DEI & Compliance Auditor",
      desc: "Automatic tracking of workplace diversity metrics, legal compliance checks, whistleblower protection, and tamper-proof activity logs.",
    },
    {
      icon: Users,
      color: "from-[var(--brand-strong)] to-[var(--purple)]",
      badge: "Self-Service Portal",
      title: "Employee Empowerment",
      desc: "Empower staff to apply for leave, submit expense claims, access company announcements, and track career reviews independently.",
    },
  ];

  const metrics = [
    { stat: "75%", label: "Faster Payroll Run", sub: "Cut processing from days to 10 minutes" },
    { stat: "$14k+", label: "Avg Annual Cost Saving", sub: "Per 50 employees compared to legacy software" },
    { stat: "99.9%", label: "System Uptime SLA", sub: "Enterprise reliability with instant cloud sync" },
    { stat: "< 10m", label: "Fast Employee Onboarding", sub: "Zero complex setup or training required" },
  ];

  return (
    <section id="why-opshub" className="py-24 bg-[var(--bg-hover)] relative overflow-hidden border-t border-[var(--border-hairline)]">
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[var(--brand)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[var(--sky)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Why Choose OpsHub
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            Stop Fighting Legacy HR Software & Manual Spreadsheets
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            OpsHub replaces fragmented tools with an all-in-one, intelligent workforce operating system built for growth.
          </p>
        </div>

        {/* Problem vs Solution Comparison Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Pain Points Box */}
          <div className="bg-card text-card-foreground border border-border bg-[var(--rose-soft)]/10 border-[var(--rose)]/30 rounded-2xl p-8 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)]/20 flex items-center justify-center text-[var(--rose)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">The Old Way (Without OpsHub)</h3>
                <p className="text-xs text-[var(--rose)] font-medium">Slow, error-prone & expensive</p>
              </div>
            </div>
            <div className="space-y-4">
              {painPoints.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)] shadow-sm">
                  <span className="text-[var(--rose)] font-bold text-sm">✕</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-main)]">{item.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Box */}
          <div className="bg-gradient-to-br from-[var(--bg-app)] via-[var(--brand-soft)] to-[var(--bg-app)] border border-[var(--brand)]/30 rounded-2xl p-8 relative shadow-lg shadow-[var(--brand)]/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand)]/30 flex items-center justify-center text-[var(--brand)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">The OpsHub Advantage</h3>
                <p className="text-xs text-[var(--brand)] font-medium">Automated, transparent & seamless</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--brand)]/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-main)]">Single Source of Truth</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">All attendance, payroll, benefits, assets, and performance logs synchronized instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--brand)]/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-main)]">Automated Localized Payroll & Bonuses</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Built-in festival bonus modules, tax structure presets, and multi-branch payroll runs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--brand)]/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-main)]">Enterprise Security & Role Permissions</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Fine-grained RBAC controls, IP allowlisting, 2FA verification, and audit logs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--brand)]/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-main)]">Predictable Flat & Fair Pricing</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">No hidden implementation fees, surprise per-seat gouging, or long-term lock-in contracts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {valuePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-card text-card-foreground border border-border rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${pillar.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-hairline)]">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">{pillar.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Key Metrics Banner */}
        <div className="bg-gradient-to-r from-[var(--bg-app)] via-[var(--bg-panel)] to-[var(--bg-app)] border border-[var(--border-hairline)] rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--border-hairline)]">
            {metrics.map((item, index) => (
              <div key={index} className={`${index > 0 ? "pt-6 md:pt-0 md:pl-8" : ""} text-center md:text-left`}>
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--sky)] to-[var(--brand)]">
                  {item.stat}
                </div>
                <div className="text-sm font-bold text-[var(--text-main)] mt-1">{item.label}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
