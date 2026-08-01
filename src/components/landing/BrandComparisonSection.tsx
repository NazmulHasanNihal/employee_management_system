import { Check, X, Minus, Shield, Zap, Sparkles } from "lucide-react";
import { T } from "@/components/Translate";

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
    <section id="comparison" className="py-24 bg-[var(--bg-app)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            {/* @ts-ignore */}<T>Competitive Comparison</T></div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            {/* @ts-ignore */}<T>How OpsHub Outperforms Legacy Software & Spreadsheets</T></h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            {/* @ts-ignore */}<T>Compare key features head-to-head and see why companies upgrade to OpsHub.</T></p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-sm">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-hover)]">
                <th className="p-5 text-sm font-bold text-[var(--text-main)] w-2/5">{/* @ts-ignore */}<T>Capabilities & Features</T></th>
                <th className="p-5 text-base font-extrabold text-[var(--text-main)] bg-[var(--brand-soft)]/20 border-x border-[var(--brand)]/20 text-center w-1/5">
                  <div className="flex items-center justify-center gap-1.5 text-[var(--brand)]">
                    <Sparkles className="w-4 h-4" />
                    {/* @ts-ignore */}<T>OpsHub</T></div>
                  <span className="block text-[11px] font-normal text-[var(--text-muted)] mt-0.5">{/* @ts-ignore */}<T>Modern All-In-One SaaS</T></span>
                </th>
                <th className="p-5 text-sm font-bold text-[var(--text-main)] text-center w-1/5">
                  {/* @ts-ignore */}<T>Legacy HR Systems</T><span className="block text-[11px] font-normal text-[var(--text-muted)] mt-0.5">{/* @ts-ignore */}<T>Workday / BambooHR</T></span>
                </th>
                <th className="p-5 text-sm font-bold text-[var(--text-main)] text-center w-1/5">
                  {/* @ts-ignore */}<T>Excel & Manual</T><span className="block text-[11px] font-normal text-[var(--text-muted)] mt-0.5">{/* @ts-ignore */}<T>Paper / Spreadsheets</T></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)] text-sm">
              {comparisonData.map((row, index) => (
                <tr key={index} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="p-5 font-semibold text-[var(--text-main)]">{row.feature}</td>

                  {/* OpsHub Column */}
                  <td className="p-5 bg-[var(--brand-soft)]/10 border-x border-[var(--brand)]/10 text-center font-medium text-[var(--text-main)]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-[var(--emerald-soft)] border border-[var(--emerald)]/40 text-[var(--emerald)] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-[var(--text-main)] mt-1">{row.opshub}</span>
                    </div>
                  </td>

                  {/* Legacy Column */}
                  <td className="p-5 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.status.legacy === true ? (
                        <div className="w-6 h-6 rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : row.status.legacy === "partial" ? (
                        <div className="w-6 h-6 rounded-full bg-[var(--amber-soft)] text-[var(--amber)] flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--rose-soft)] text-[var(--rose)] flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs text-[var(--text-muted)] mt-1">{row.legacy}</span>
                    </div>
                  </td>

                  {/* Excel Column */}
                  <td className="p-5 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {row.status.excel === true ? (
                        <div className="w-6 h-6 rounded-full bg-[var(--emerald-soft)] text-[var(--emerald)] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : row.status.excel === "partial" ? (
                        <div className="w-6 h-6 rounded-full bg-[var(--amber-soft)] text-[var(--amber)] flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[var(--rose-soft)] text-[var(--rose)] flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs text-[var(--text-muted)] mt-1">{row.excel}</span>
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
