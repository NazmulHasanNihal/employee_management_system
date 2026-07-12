'use client';

import { trpc } from '@/lib/trpc/client';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  customUserNode: ({ data }: any) => (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg w-64">
      <div className="flex items-center gap-4">
        {data.image ? (
          <img src={data.image} alt={data.label} className="w-12 h-12 rounded-full border border-[var(--border-color)]" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--bg-main)] flex items-center justify-center border border-[var(--border-color)] text-xl font-bold">
            {data.label.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-bold text-white text-sm">{data.label}</h3>
          <p className="text-xs text-[var(--text-muted)]">{data.designation || 'Employee'}</p>
          <p className="text-xs text-blue-400 mt-1">{data.department || 'No Department'}</p>
        </div>
      </div>
    </div>
  ),
};

export default function OrgChartPage() {
  const { data, isLoading } = trpc.team.getOrgChart.useQuery();

  if (isLoading) return <div className="p-8">Loading Org Chart...</div>;

  // Simple layouting since we don't have dagre installed. 
  // We'll just scatter them slightly so they aren't all at 0,0, but the user can drag them.
  const positionedNodes = data?.nodes.map((node, i) => ({
    ...node,
    position: { x: (i % 5) * 300 + 50, y: Math.floor(i / 5) * 200 + 50 }
  })) || [];

  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-mono">
          Interactive Org Chart
        </h1>
        <p className="text-[var(--text-muted)] mt-2 font-mono">
          Simulate capacity planning and view reporting structures. Drag nodes to explore.
        </p>
      </div>

      <div className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-2xl relative min-h-[600px]">
        <ReactFlow
          nodes={positionedNodes}
          edges={data?.edges || []}
          nodeTypes={nodeTypes}
          fitView
          className="bg-black/50"
        >
          <Background color="#333" gap={16} />
          <Controls className="bg-[var(--bg-card)] border-none text-white fill-white" />
          <MiniMap className="bg-[var(--bg-card)] border border-[var(--border-color)]" maskColor="rgba(0,0,0,0.5)" />
        </ReactFlow>
      </div>
    </div>
  );
}
