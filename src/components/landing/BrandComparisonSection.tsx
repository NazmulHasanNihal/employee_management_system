import { Check, X, Minus, Shield, Zap, Sparkles } from "lucide-react";

export default function BrandComparisonSection() {
  const comparisonData = [
    {
      feature: "Automated Payroll & Festival Bonus Engine",
      opshub: "Yes - Native 1-click bonus & tax rules",
      legacy: "Extra Paid Add-on",
      excel: "Manual & High Error Risk",
      status: { opshub: true, legacy: "partial", excel: false },
    },
    {
      feature: "Real-Time Shift & Attendance Sync",
      opshub: "Automated with geofence & live clock",
      legacy: "Requires third-party integrations",
      excel: "Manual attendance sheets",
      status: { opshub: true, legacy: "partial", excel: false },
    },
    {
      feature: "DEI Auditor & Compliance Vault",
      opshub: "Included free with audit logs",
      legacy: "$5,000+ Enterprise tier add-on",
      excel: "None",
      status: { opshub: true, legacy: false, excel: false },
    },
    {
      feature: "IT Asset Management & HR Helpdesk",
      opshub: "Unified native module",
      legacy: "Requires separate software tools",
      excel: "Untracked email requests",
      status: { opshub: true, legacy: false, excel: false },
    },
    {
      feature: "Implementation & Onboarding Time",
      opshub: "< 10 Minutes (Self-service)",
      legacy: "3 - 6 Months of consulting",
      excel: "Immediate (but constant manual work)",
      status: { opshub: true, legacy: false, excel: "partial" },
    },
    {
      feature: "Transparent Pricing & No Hidden Fees",
      opshub: "Flat predictable tier pricing",
      legacy: "Opaque quotes & annual contracts",
      excel: "Hidden cost in lost staff hours",
      status: { opshub: true, legacy: false, excel: false },
    },
    {
      feature: "Role-Based Security, 2FA & IP Allowlist",
      opshub: "Bank-grade protection included",
      legacy: "Available on highest plan only",
      excel: "Password-less shared files",
      status: { opshub: true, legacy: "partial", excel: false },
    },
    {
      feature: "Whistleblower Channel & Performance Reviews",
      opshub: "Built-in anonymous reporting",
      legacy: "Limited or custom dev required",
      excel: "None",
      status: { opshub: true, legacy: "partial", excel: false },
    },
  ];

  return (
    <section id="comparison" className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            Competitive Comparison
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How OpsHub Outperforms Legacy Software & Spreadsheets
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Compare key features head-to-head and see why companies upgrade to OpsHub.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="p-5 text-sm font-bold text-slate-300 w-2/5">Capabilities & Features</th>
                <th className="p-5 text-base font-extrabold text-white bg-gradient-to-b from-indigo-900/50 to-slate-900/80 border-x border-indigo-500/30 text-center w-1/5">
                  <div className="flex items-center justify-center gap-1.5 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    OpsHub
                  </div>
                  <span className="block text-[11px] font-normal text-slate-400 mt-0.5">Modern All-In-One SaaS</span>
                </th>
                <th className="p-5 text-sm font-bold text-slate-400 text-center w-1/5">
                  Legacy HR Systems
                  <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Workday / BambooHR</span>
                </th>
                <th className="p-5 text-sm font-bold text-slate-400 text-center w-1/5">
                  Excel & Manual
                  <span className="block text-[11px] font-normal text-slate-500 mt-0.5">Paper / Spreadsheets</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {comparisonData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-5 font-semibold text-slate-200">{row.feature}</td>

                  {/* OpsHub Column */}
                  <td className="p-5 bg-indigo-950/20 border-x border-indigo-500/20 text-center font-medium text-white">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-slate-200 mt-1">{row.opshub}</span>
                    </div>
                  </td>

                  {/* Legacy Column */}
                  <td className="p-5 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.status.legacy === true ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : row.status.legacy === "partial" ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs text-slate-400 mt-1">{row.legacy}</span>
                    </div>
                  </td>

                  {/* Excel Column */}
                  <td className="p-5 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.status.excel === true ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : row.status.excel === "partial" ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs text-slate-400 mt-1">{row.excel}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
