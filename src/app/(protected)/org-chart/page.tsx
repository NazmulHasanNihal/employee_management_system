"use client";

import React, { useCallback, useMemo } from 'react';
import { Network } from 'lucide-react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position, Handle } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { trpc } from '@/lib/trpc/client';

const CustomNode = ({ data }: any) => {
  return (
    <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-xl p-4 shadow-[0_0_15px_rgba(0,255,255,0.2)] w-48 text-center text-white">
      <Handle type="target" position={Position.Top} className="!bg-cyan-500" />
      <div className="font-mono font-bold text-sm truncate">{data.name}</div>
      <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-1 truncate">{data.designation}</div>
      <div className="text-[10px] text-gray-400 mt-2 truncate">{data.department}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Flatten tree to nodes and edges (BFS)
const getNodesAndEdges = (treeNode: any, x = 0, y = 0, level = 0, siblingIndex = 0) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  if (!treeNode) return { nodes, edges };

  // Generate node
  const nodeId = treeNode.id || `node-${Math.random()}`;
  nodes.push({
    id: nodeId,
    type: 'custom',
    position: { x, y },
    data: { 
      name: treeNode.name, 
      designation: treeNode.designation, 
      department: treeNode.department 
    }
  });

  if (treeNode.children && treeNode.children.length > 0) {
    const childY = y + 150;
    const totalChildren = treeNode.children.length;
    const startX = x - ((totalChildren - 1) * 200) / 2;

    treeNode.children.forEach((child: any, i: number) => {
      const childX = startX + (i * 200);
      const childData = getNodesAndEdges(child, childX, childY, level + 1, i);
      
      const childNodeId = childData.nodes[0]?.id;
      
      if (childNodeId) {
        edges.push({
          id: `e-${nodeId}-${childNodeId}`,
          source: nodeId,
          target: childNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'rgba(0,255,255,0.5)', strokeWidth: 2 }
        });
      }

      nodes.push(...childData.nodes);
      edges.push(...childData.edges);
    });
  }

  return { nodes, edges };
};

export default function OrgChartPage() {
  const { data: orgTree, isLoading } = trpc.team.getOrgChart.useQuery();

  const { nodes, edges } = useMemo(() => {
    if (!orgTree) return { nodes: [], edges: [] };
    // Start at center x=250
    return getNodesAndEdges(orgTree, 250, 50);
  }, [orgTree]);

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Mapping Network Topology...</div>;
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 pb-20 md:pb-0 max-w-[100vw] overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 shrink-0 relative px-2">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Network className="text-cyan-400" size={36} />
            Live Org Chart
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Dynamic, perfectly responsive hierarchical visualization.
          </p>
        </div>
      </div>

      <div className="flex-1 mt-6 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative bg-[#050505]">
        {orgTree ? (
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            fitView
            className="bg-[var(--bg-void)]"
            minZoom={0.2}
          >
            <Background color="#00ffff" gap={20} size={1} />
            <Controls className="!bg-black/50 !border-white/10 !fill-white" />
          </ReactFlow>
        ) : (
          <div className="text-center text-[var(--text-muted)] font-mono uppercase tracking-widest mt-20">No Org Data Found</div>
        )}
      </div>
    </div>
  );
}
