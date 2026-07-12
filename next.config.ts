import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  /* config options here */
};

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(
  withSerwist(nextConfig),
  {
    org: "mock-org",
    project: "mock-project",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
);
