import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // Type errors now fail the build (the codebase type-checks clean).
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint is run separately via `pnpm lint`; don't block production builds on lint warnings.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Serve modern formats so avatars/documents are smaller over the wire.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // Tree-shake heavy icon/component barrels so they don't ship whole libraries
  // in the shared chunk. This noticeably trims the ~187 kB common bundle.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@xyflow/react",
      "reactflow",
      "date-fns",
      "@radix-ui/react-slot",
      "@base-ui/react",
    ],
  },
  // ── Security headers ──────────────────────────────────────────────────────
  // Applied to every route response. Hardening against XSS, clickjacking,
  // MIME sniffing, and protocol downgrade. CSP allows first-party assets and
  // the external services the app actually talks to (Supabase, Sentry, GitHub
  // avatars, PartyKit realtime). Script/style use unsafe-inline because the
  // framework and Tailwind emit inline styles/scripts; this still blocks
  // loading scripts/styles from arbitrary third-party origins.
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseHost = (() => {
      try {
        return new URL(supabaseUrl).host;
      } catch {
        return "*.supabase.co";
      }
    })();
    const csp = [
      "default-src 'self'",
      `img-src 'self' data: blob: https://${supabaseHost} https://avatars.githubusercontent.com`,
      `font-src 'self' data:`,
      `connect-src 'self' https://${supabaseHost} https://*.sentry.io wss://*.partykit.dev wss://*.partykit.io`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

import { withSentryConfig } from "@sentry/nextjs";

// Sentry is only fully active when NEXT_PUBLIC_SENTRY_DSN is set. Without it
// the SDK silently no-ops (errors are dropped) — that is the intended dev
// behaviour, not an error. org/project/authToken drive source-map upload and
// release tracking; they fall back safely when unset.
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG || "nazrat",
    project: process.env.SENTRY_PROJECT || "javascript-nextjs",
    // Only upload source maps / talk to Sentry when a real DSN is configured.
    silent: sentryEnabled ? false : true,
    authToken: process.env.SENTRY_AUTH_TOKEN || "dummy_token_to_suppress_warning",
    widenClientFileUpload: true,
    sourcemaps: {
      // Upload maps in prod so stack traces are de-minified and actionable.
      disable: !sentryEnabled,
    },
  }
);
