"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * Lazy-loaded Org Chart. The @xyflow/react (ReactFlow) bundle is heavy
 * (~150kB) and only needed on this page, so we code-split it and disable SSR
 * (the canvas is client-only). A skeleton spinner shows while the chunk loads.
 */
const OrgChartFlow = dynamic(
  () => import("@/components/org-chart/OrgChartFlow"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
      </div>
    ),
  },
);

export default function OrgChartLazy({ tree }: { tree: any }) {
  return <OrgChartFlow tree={tree} />;
}
