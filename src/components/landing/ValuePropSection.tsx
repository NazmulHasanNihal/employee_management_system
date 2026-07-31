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
      color: "from-blue-500 to-indigo-600",
      badge: "85% Time Saved",
      title: "Automated Time & Attendance",
      desc: "Smart shift scheduling, geofenced clock-ins, leave balance tracking, and real-time overtime calculations in one unified dashboard.",
    },
    {
      icon: DollarSign,
      color: "from-emerald-500 to-teal-600",
      badge: "Zero Payroll Errors",
      title: "1-Click Payroll & Bonus Engine",
      desc: "Run accurate monthly payouts, festival bonuses, tax withholdings, and instant payslip distribution directly to employee portals.",
    },
    {
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-600",
      badge: "Bank-Grade Compliance",
      title: "DEI & Compliance Auditor",
      desc: "Automatic tracking of workplace diversity metrics, legal compliance checks, whistleblower protection, and tamper-proof activity logs.",
    },
    {
      icon: Users,
      color: "from-purple-500 to-pink-600",
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
    <section id="why-opshub" className="py-24 bg-slate-900/60 relative overflow-hidden border-t border-b border-slate-800/60">
      {/* Background Subtle Gradient Spheres */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Why Choose OpsHub
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop Fighting Legacy HR Software & Manual Spreadsheets
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            OpsHub replaces fragmented tools with an all-in-one, intelligent workforce operating system built for growth.
          </p>
        </div>

        {/* Problem vs Solution Comparison Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Pain Points Box */}
          <div className="bg-slate-950/70 border border-rose-900/30 rounded-2xl p-8 backdrop-blur-sm relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">The Old Way (Without OpsHub)</h3>
                <p className="text-xs text-rose-400 font-medium">Slow, error-prone & expensive</p>
              </div>
            </div>
            <div className="space-y-4">
              {painPoints.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/20">
                  <span className="text-rose-500 font-bold text-sm">✕</span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Box */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-8 backdrop-blur-sm relative shadow-xl shadow-indigo-950/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">The OpsHub Advantage</h3>
                <p className="text-xs text-cyan-400 font-medium">Automated, transparent & seamless</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Single Source of Truth</h4>
                  <p className="text-xs text-slate-300 mt-0.5">All attendance, payroll, benefits, assets, and performance logs synchronized instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Automated Localized Payroll & Bonuses</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Built-in festival bonus modules, tax structure presets, and multi-branch payroll runs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Enterprise Security & Role Permissions</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Fine-grained RBAC controls, IP allowlisting, 2FA verification, and audit logs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Predictable Flat & Fair Pricing</h4>
                  <p className="text-xs text-slate-300 mt-0.5">No hidden implementation fees, surprise per-seat gouging, or long-term lock-in contracts.</p>
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
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${pillar.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Key Metrics Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {metrics.map((item, index) => (
              <div key={index} className={`${index > 0 ? "pt-6 md:pt-0 md:pl-8" : ""} text-center md:text-left`}>
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                  {item.stat}
                </div>
                <div className="text-sm font-bold text-white mt-1">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
