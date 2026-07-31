import Link from "next/link";
import {
  Zap, ArrowRight, CheckCircle2, ShieldCheck, Star, Users, Clock,
  DollarSign, Sparkles, HelpCircle, ChevronRight, BarChart3, Lock, Award
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import ValuePropSection from "@/components/landing/ValuePropSection";
import BrandComparisonSection from "@/components/landing/BrandComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import RoiCalculator from "@/components/landing/RoiCalculator";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function SaaSMainPage() {
  const testimonials = [
    {
      quote: "OpsHub cut our monthly payroll processing time from 4 days to under 15 minutes. The automated festival bonus feature alone saved us from massive manual spreadsheet errors.",
      author: "Sarah Jenkins",
      role: "Head of People & Culture",
      company: "Apex Innovations (120 Employees)",
      avatar: "SJ",
    },
    {
      quote: "We replaced BambooHR and separate shift scheduling apps with OpsHub. We saved over $12,000 annually while giving our team a vastly superior mobile experience.",
      author: "David Chen",
      role: "VP of Operations",
      company: "Nexus Logistics (250 Employees)",
      avatar: "DC",
    },
    {
      quote: "The built-in DEI and compliance audit logs give our board complete peace of mind. Onboarding new staff takes less than 10 minutes now.",
      author: "Elena Rostova",
      role: "Chief Executive Officer",
      company: "Vanguard Tech",
      avatar: "ER",
    },
  ];

  const faqs = [
    {
      q: "How fast can we set up OpsHub for our company?",
      a: "Setup takes less than 10 minutes. You can import employee records via CSV or invite staff via email links. No complex IT installation or long consulting setup required.",
    },
    {
      q: "Can I try OpsHub before committing to a paid plan?",
      a: "Yes! Every account starts with a 14-day risk-free trial with access to all Pro features. No credit card is required to begin.",
    },
    {
      q: "How does OpsHub handle localized payroll & festival bonuses?",
      a: "OpsHub comes with built-in multi-currency payroll rules, tax withholding structures, and automated festival bonus calculation modules tailored for your regional workforce.",
    },
    {
      q: "Is our employee data secure on OpsHub?",
      a: "Extremely secure. We enforce 256-bit SSL encryption in transit and at rest, SOC-2 compliant database infrastructure, 2FA authentication, fine-grained role permissions, and IP allowlisting.",
    },
    {
      q: "Can we upgrade or downgrade our subscription anytime?",
      a: "Absolutely. You can switch between Monthly and Annual billing or change plan tiers (Starter, Pro, Enterprise) anytime directly from your billing settings.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased">
      {/* SaaS Top Header */}
      <LandingHeader />

      <main className="pt-24 sm:pt-32">
        {/* ================================================================= */}
        {/* HERO SECTION                                                      */}
        {/* ================================================================= */}
        <section className="relative pt-12 pb-24 overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[var(--brand)]/20 via-[var(--sky)]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-panel)] border border-[var(--border-hairline)] shadow-sm mb-8 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-[var(--brand)] animate-ping" />
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  ✨ Modern Workforce SaaS Platform
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--border-hairline)]">
                  v2.4 Live
                </span>
              </div>

              {/* High Impact Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-main)] leading-[1.15]">
                All Your HR, Payroll & Operations in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--sky)] via-[var(--brand)] to-[var(--brand-strong)]">
                  One Smart Hub.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
                OpsHub automates shift rosters, 1-click payroll, festival bonuses, attendance tracking, and compliance auditing into a single intuitive platform built for growing teams.
              </p>

              {/* Action CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login?signup=true"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-base btn-primary flex items-center justify-center gap-2"
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#pricing"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base btn-secondary flex items-center justify-center gap-2"
                >
                  View Pricing Plans
                </Link>
              </div>

              {/* Trust Subtext */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--emerald)]" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--emerald)]" />
                  Instant 10-min setup
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--emerald)]" />
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Dashboard Visual Teaser Card */}
            <div className="mt-16 relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[var(--brand-strong)] via-[var(--sky)] to-[var(--brand)] opacity-20 blur-xl pointer-events-none" />
              <div className="relative rounded-2xl ledger-card overflow-hidden p-6 sm:p-8">
                {/* Visual Top Bar Mockup */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-hairline)]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[var(--rose)]" />
                      <div className="w-3 h-3 rounded-full bg-[var(--amber)]" />
                      <div className="w-3 h-3 rounded-full bg-[var(--emerald)]" />
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)] ml-2">app.opshub.io/dashboard</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--emerald-soft)] border border-[var(--emerald)]/20 text-[var(--emerald)] text-xs font-semibold">
                    Live System Active 🟢
                  </div>
                </div>

                {/* Dashboard Stats Teaser Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
                      <span>Active Employees</span>
                      <Users className="w-4 h-4 text-[var(--brand)]" />
                    </div>
                    <div className="text-2xl font-extrabold text-[var(--text-main)]">128 Staff</div>
                    <span className="text-[10px] text-[var(--emerald)] font-semibold mt-1 block">↑ 12% vs last month</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
                      <span>Attendance Rate</span>
                      <Clock className="w-4 h-4 text-[var(--emerald)]" />
                    </div>
                    <div className="text-2xl font-extrabold text-[var(--text-main)]">98.4%</div>
                    <span className="text-[10px] text-[var(--sky)] font-semibold mt-1 block">Live geofence active</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
                      <span>Monthly Payroll</span>
                      <DollarSign className="w-4 h-4 text-[var(--sky)]" />
                    </div>
                    <div className="text-2xl font-extrabold text-[var(--text-main)]">$84,500</div>
                    <span className="text-[10px] text-[var(--emerald)] font-semibold mt-1 block">1-Click Payout Ready</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
                      <span>Compliance Score</span>
                      <ShieldCheck className="w-4 h-4 text-[var(--brand-strong)]" />
                    </div>
                    <div className="text-2xl font-extrabold text-[var(--text-main)]">100% Pass</div>
                    <span className="text-[10px] text-[var(--brand-strong)] font-semibold mt-1 block">DEI Vault verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* ABOUT US SECTION                                                  */}
        {/* ================================================================= */}
        <AboutSection />

        {/* ================================================================= */}
        {/* WHY OPSHUB & VALUE PROPOSITION                                    */}
        {/* ================================================================= */}
        <ValuePropSection />

        {/* ================================================================= */}
        {/* BRAND COMPARISON MATRIX                                           */}
        {/* ================================================================= */}
        <BrandComparisonSection />

        {/* ================================================================= */}
        {/* ROI SAVINGS CALCULATOR                                            */}
        {/* ================================================================= */}
        <RoiCalculator />

        {/* ================================================================= */}
        {/* PRICING SECTION                                                   */}
        {/* ================================================================= */}
        <PricingSection />

        {/* ================================================================= */}
        {/* TESTIMONIALS SECTION                                              */}
        {/* ================================================================= */}
        <section className="py-24 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--amber-soft)] border border-[var(--amber)]/20 text-[var(--amber)] text-xs font-semibold uppercase tracking-wider mb-4">
                <Star className="w-3.5 h-3.5 fill-[var(--amber)]" />
                Customer Success Stories
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
                Trusted by Fast-Growing Companies Worldwide
              </h2>
              <p className="mt-4 text-lg text-[var(--text-muted)]">
                Here is why HR Leaders and Operations Managers love OpsHub.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, index) => (
                <div
                  key={index}
                  className="ledger-card rounded-3xl p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 text-[var(--amber)] mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[var(--amber)]" />
                      ))}
                    </div>
                    <p className="text-[var(--text-main)] text-sm leading-relaxed italic">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-[var(--border-hairline)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--brand)] to-[var(--sky)] text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {t.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-main)]">{t.author}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                      <p className="text-[11px] text-[var(--brand)] font-medium">{t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FAQ ACCORDION                                                     */}
        {/* ================================================================= */}
        <section id="faq" className="py-24 bg-[var(--bg-hover)] relative border-t border-[var(--border-hairline)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold uppercase tracking-wider mb-4">
                <HelpCircle className="w-3.5 h-3.5" />
                Got Questions?
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--bg-panel)] border border-[var(--border-hairline)] rounded-2xl p-6 shadow-sm hover:border-[var(--border-strong)] transition-colors"
                >
                  <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span className="text-[var(--brand)] font-mono">Q.</span>
                    {faq.q}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* CONTACT SECTION                                                   */}
        {/* ================================================================= */}
        <ContactSection />

        {/* ================================================================= */}
        {/* BOTTOM CTA BANNER                                                 */}
        {/* ================================================================= */}
        <section className="py-20 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-r from-[var(--brand-strong)] via-[var(--brand)] to-[var(--sky)] p-10 sm:p-16 text-center shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to Automate Your Workforce Operations?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
                Join hundreds of businesses running their workforce smoothly with OpsHub. Start your 14-day free trial today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login?signup=true"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-base text-[var(--brand-strong)] bg-white shadow-xl shadow-white/20 flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
                >
                  Get Started Free Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-white bg-black/20 hover:bg-black/30 border border-white/20 flex items-center justify-center gap-2 transition-colors"
                >
                  Log In to Existing Workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
