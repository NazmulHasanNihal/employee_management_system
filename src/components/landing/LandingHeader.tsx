"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn, ArrowRight, Menu, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LandingHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-panel)]/90 backdrop-blur-md border-b border-[var(--border-hairline)] shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--brand-strong)] via-[var(--brand)] to-[var(--sky)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[var(--text-main)] flex items-center gap-1">
                OpsHub<span className="text-[var(--brand)]">.</span>
              </span>
              <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest -mt-1">
                Workforce SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              Features
            </Link>
            <Link href="#why-opshub" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              Why OpsHub
            </Link>
            <Link href="#about" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              About Us
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              FAQ
            </Link>
            <Link href="#contact" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              Contact
            </Link>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isLoggedIn === true ? (
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </Link>
                <Link
                  href="/login?signup=true"
                  className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-6 border-t border-[var(--border-hairline)] flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1"
            >
              Features
            </Link>
            <Link
              href="#why-opshub"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1"
            >
              Why OpsHub
            </Link>
            <Link
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1"
            >
              About Us
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1"
            >
              FAQ
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1"
            >
              Contact
            </Link>

            <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-col gap-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-xl font-semibold btn-primary"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl font-medium btn-secondary"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/login?signup=true"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-xl font-semibold btn-primary"
                  >
                    Start 14-Day Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
