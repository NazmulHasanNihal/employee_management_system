"use client";

import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1000);
  };

  return (
    <section id="contact" className="py-24 bg-[var(--bg-app)] relative border-t border-[var(--border-hairline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-semibold uppercase tracking-wider mb-4">
            Get in touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
            Contact Our Sales Team
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            Have questions about enterprise pricing or need a custom implementation? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Contact Form */}
          <div className="bg-card text-card-foreground border border-border p-8 rounded-3xl shadow-sm border-[var(--border-hairline)]">
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--text-main)]">First Name</label>
                  <input type="text" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full" placeholder="John" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--text-main)]">Last Name</label>
                  <input type="text" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full" placeholder="Doe" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-main)]">Work Email</label>
                <input type="email" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full" placeholder="john@company.com" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-main)]">Company Name</label>
                <input type="text" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full" placeholder="Acme Corp" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-main)]">How can we help?</label>
                <textarea required rows={4} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full resize-none" placeholder="Tell us about your team size and requirements..." />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </span>
                ) : isSubmitted ? (
                  <span className="text-[var(--emerald)] flex items-center gap-2">
                    Message Sent!
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col justify-center gap-10">
            <div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2">We'd love to hear from you</h3>
              <p className="text-[var(--text-muted)]">
                Whether you're curious about features, a free trial, or even press, we're ready to answer any and all questions.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-hairline)] flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-[var(--brand)]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--text-main)]">Email Us</h4>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Our friendly team is here to help.</p>
                  <a href="mailto:hello@opshub.io" className="text-sm font-semibold text-[var(--brand)] hover:underline mt-2 inline-block">
                    hello@opshub.io
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-hairline)] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[var(--brand)]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--text-main)]">Our Office</h4>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Come say hello at our HQ.</p>
                  <p className="text-sm font-semibold text-[var(--text-main)] mt-2">
                    100 Innovation Drive<br />
                    Suite 400<br />
                    San Francisco, CA 94103
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-hairline)] flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-[var(--brand)]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--text-main)]">Call Us</h4>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Mon-Fri from 8am to 6pm PST.</p>
                  <a href="tel:+18005550199" className="text-sm font-semibold text-[var(--brand)] hover:underline mt-2 inline-block">
                    +1 (800) 555-0199
                  </a>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
