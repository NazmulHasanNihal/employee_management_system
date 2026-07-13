"use client";

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Network, UserCircle, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Recursive Org Node Component
const OrgNode = ({ node, level = 0 }: { node: any, level?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: level * 0.1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className={`w-64 bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.1)] overflow-hidden group hover:border-cyan-400 transition-all ${expanded ? 'ring-2 ring-cyan-500/20 ring-offset-2 ring-offset-black' : ''}`}>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="bg-cyan-500/10 p-4 border-b border-cyan-500/20 flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 text-cyan-300 font-bold font-mono text-lg shrink-0">
              {node.avatar || <UserCircle size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white text-sm font-mono truncate">{node.name}</h3>
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-0.5 truncate">{node.designation}</p>
            </div>
          </div>

          <div className="p-3 flex items-center justify-between bg-black/40 relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest truncate">
              <Briefcase size={12} className="shrink-0" /> {node.department}
            </div>
            {hasChildren && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {hasChildren && (
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center relative overflow-hidden"
            >
              {/* Vertical line down from parent */}
              <div className="w-px h-8 bg-cyan-500/30 shadow-[0_0_8px_rgba(0,255,255,0.5)]"></div>
              
              <div className="flex relative pt-4">
                {/* Horizontal line connecting siblings (only show if multiple children) */}
                {node.children.length > 1 && (
                  <div className="absolute top-0 left-[50%] -translate-x-[50%] w-[calc(100%-256px)] h-px bg-cyan-500/30 shadow-[0_0_8px_rgba(0,255,255,0.5)]"></div>
                )}
                
                <div className="flex gap-4 md:gap-8 justify-center">
                  {node.children.map((child: any, idx: number) => (
                    <div key={child.id} className="relative pt-4 flex flex-col items-center">
                      {/* Vertical line down to child */}
                      <div className="absolute top-0 left-1/2 -ml-px w-px h-4 bg-cyan-500/30 shadow-[0_0_8px_rgba(0,255,255,0.5)]"></div>
                      <OrgNode node={child} level={level + 1} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default function OrgChartPage() {
  const { data, isLoading } = trpc.team.getOrgChart.useQuery();

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Mapping Network Topology...</div>;
  }

  // Use the nested tree structure from our API
  const orgTree = data;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 pb-20 md:pb-0 max-w-[100vw] overflow-hidden">
      
      {/* Header */}
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

      <div className="flex-1 mt-6 border border-white/10 rounded-3xl overflow-auto shadow-2xl relative bg-[#050505] custom-scrollbar">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
        
        {/* CSS Grid/Flexbox approach for the tree */}
        <div className="min-w-max min-h-full p-12 flex justify-center items-start">
          {orgTree ? (
            <OrgNode node={orgTree} />
          ) : (
            <div className="text-center text-[var(--text-muted)] font-mono uppercase tracking-widest mt-20">No Org Data Found</div>
          )}
        </div>
      </div>
    </div>
  );
}
