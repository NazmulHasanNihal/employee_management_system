import Link from "next/link";
import { ArrowLeft, Check, Sparkles, HelpCircle } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import PricingSection from "@/components/landing/PricingSection";
import BrandComparisonSection from "@/components/landing/BrandComparisonSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      <LandingHeader />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to OpsHub Home
          </Link>
        </div>

        {/* Pricing Matrix */}
        <PricingSection />

        {/* Brand Comparison */}
        <BrandComparisonSection />
      </main>

      <LandingFooter />
    </div>
  );
}
