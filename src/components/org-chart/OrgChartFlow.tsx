'use client';

import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position, Handle, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface TreeNode {
  id: string;
  name: string;
  designation?: string | null;
  department?: string | null;
  children?: TreeNode[];
}

interface OrgNodeData {
  name: string;
  designation?: string | null;
  department?: string | null;
}

const CustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as OrgNodeData;
  return (
    <div className="w-48 rounded-xl border border-[var(--brand)]/40 bg-[var(--bg-panel)] p-4 text-center shadow-md">
      <Handle type="target" position={Position.Top} className="!bg-[var(--brand)]" />
      <div className="truncate text-sm font-semibold text-[var(--text-main)]">{d.name}</div>
      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-[var(--brand)]">{d.designation}</div>
      <div className="mt-1 truncate text-[10px] text-[var(--text-muted)]">{d.department}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--brand)]" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const getNodesAndEdges = (treeNode: TreeNode, x = 0, y = 0): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (!treeNode) return { nodes, edges };

  const nodeId = treeNode.id;
  nodes.push({
    id: nodeId,
    type: 'custom',
    position: { x, y },
    data: { name: treeNode.name, designation: treeNode.designation, department: treeNode.department },
  });

  if (treeNode.children && treeNode.children.length > 0) {
    const childY = y + 150;
    const totalChildren = treeNode.children.length;
    const startX = x - ((totalChildren - 1) * 200) / 2;

    treeNode.children.forEach((child, i) => {
      const childX = startX + i * 200;
      const childData = getNodesAndEdges(child, childX, childY);
      const childNodeId = childData.nodes[0]?.id;
      if (childNodeId) {
        edges.push({
          id: `e-${nodeId}-${childNodeId}`,
          source: nodeId,
          target: childNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'var(--brand)', strokeWidth: 2 },
        });
      }
      nodes.push(...childData.nodes);
      edges.push(...childData.edges);
    });
  }
  return { nodes, edges };
};

export default function OrgChartFlow({ tree }: { tree: TreeNode }) {
  const { nodes, edges } = useMemo(() => getNodesAndEdges(tree, 250, 50), [tree]);

  return (
    <div className="h-full min-h-[70vh] flex-1 overflow-hidden rounded-3xl border border-[var(--border-hairline)]" style={{ background: 'var(--bg-app)' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.2}>
        <Background color="var(--border-hairline)" gap={20} size={1} />
        <Controls className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)]" />
        <MiniMap className="!bg-[var(--bg-panel)]" />
      </ReactFlow>
    </div>
  );
}
