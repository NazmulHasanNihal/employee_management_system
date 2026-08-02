'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position, Handle, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, User } from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  role?: string | null;
  designation?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  children?: TreeNode[];
}

interface OrgNodeData {
  id: string;
  name: string;
  role?: string | null;
  designation?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  childrenCount: number;
}

const CustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as OrgNodeData;
  const isTopRole = d.role === 'CEO' || d.role === 'Admin' || d.role === 'Executive';

  return (
    <div className={`group relative w-64 cursor-pointer rounded-2xl border bg-[var(--bg-panel)] p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
      isTopRole
        ? 'border-[var(--brand)] shadow-[var(--brand-soft)] ring-2 ring-[var(--brand)]/20'
        : 'border-[var(--border-hairline)] hover:border-[var(--brand)]/60'
    }`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-[var(--brand)] !border-2 !border-[var(--bg-panel)]" />
      
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar src={d.avatarUrl} name={d.name} size="md" />
          {isTopRole && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow">
              <Shield size={10} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--brand)] transition-colors">
            {d.name}
          </div>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[var(--brand)]">
            {d.designation || d.role || 'Team Member'}
          </div>
          {d.department && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)] truncate">
              <Building2 size={10} className="shrink-0" />
              <span className="truncate">{d.department}</span>
            </div>
          )}
        </div>
      </div>

      {d.childrenCount > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-hairline)] pt-2 text-[10px] font-medium text-[var(--text-muted)]">
          <span>Direct Reports</span>
          <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 font-bold text-[var(--brand)]">
            {d.childrenCount}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-[var(--brand)] !border-2 !border-[var(--bg-panel)]" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

// Calculate recursive subtree width (minimum 280px per node branch)
const getSubtreeWidth = (node: TreeNode): number => {
  if (!node.children || node.children.length === 0) return 280;
  let width = 0;
  for (const child of node.children) {
    width += getSubtreeWidth(child);
  }
  return Math.max(280, width);
};

// Tree layout algorithm: centers parents above children without overlapping
const layoutTree = (treeNode: TreeNode, x = 0, y = 0): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (!treeNode) return { nodes, edges };

  const nodeId = treeNode.id;
  nodes.push({
    id: nodeId,
    type: 'custom',
    position: { x, y },
    data: {
      id: treeNode.id,
      name: treeNode.name,
      role: treeNode.role,
      designation: treeNode.designation,
      department: treeNode.department,
      avatarUrl: treeNode.avatarUrl,
      childrenCount: treeNode.children?.length || 0,
    },
  });

  if (treeNode.children && treeNode.children.length > 0) {
    const childY = y + 170; // vertical spacing
    const totalSubtreeWidth = getSubtreeWidth(treeNode);
    let currentX = x - totalSubtreeWidth / 2;

    treeNode.children.forEach((child) => {
      const childWidth = getSubtreeWidth(child);
      const childX = currentX + childWidth / 2;
      currentX += childWidth;

      const childData = layoutTree(child, childX, childY);
      const childNodeId = childData.nodes[0]?.id;
      if (childNodeId) {
        edges.push({
          id: `e-${nodeId}-${childNodeId}`,
          source: nodeId,
          target: childNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'var(--brand)', strokeWidth: 2.5 },
        });
      }
      nodes.push(...childData.nodes);
      edges.push(...childData.edges);
    });
  }
  return { nodes, edges };
};

export default function OrgChartFlow({ tree }: { tree: TreeNode }) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => layoutTree(tree, 0, 40), [tree]);

  return (
    <div className="h-full min-h-[min(75vh,52rem)] flex-1 overflow-hidden rounded-3xl border border-[var(--border-hairline)] shadow-xl relative" style={{ background: 'var(--bg-app)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.1}
        maxZoom={1.8}
        onNodeClick={(_, node) => router.push(`/profile?id=${node.id}`)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border-hairline)" gap={24} size={1.5} />
        <Controls className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)] !shadow-lg !rounded-2xl" />
        <MiniMap className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)] !rounded-2xl" pannable zoomable />
      </ReactFlow>
    </div>
  );
}
