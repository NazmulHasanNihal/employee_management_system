"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Clock, Target, Calendar, PhoneCall, 
  MessageSquare, UserCircle, CheckCircle2, Check,
  UserPlus, X, Shield, ShieldAlert, CalendarClock,
  Layers, Filter, Eye, AlertTriangle
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const CustomNode = ({ data }: any) => {
  return (
    <div className="px-4 py-2 shadow-xl rounded-lg bg-[#111] border border-white/20 min-w-[150px] font-mono text-center">
      <div className="text-white font-bold text-sm">{data.label}</div>
      <div className="text-[var(--text-muted)] text-[10px] mt-1 uppercase tracking-widest">{data.role}</div>
      <div className="text-[var(--ledger-blue)] text-[9px] mt-1">{data.department}</div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function TeamDashboardPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager' || user?.role === 'Super Admin';

  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [impersonateId, setImpersonateId] = useState('');
  const [viewMode, setViewMode] = useState<'department' | 'squad'>('department');
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  
  // React Flow state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const fetchHierarchy = async () => {
    setLoading(true);
    let url = '/api/hierarchy?viewMode=' + viewMode;
    if (impersonateId) url += '&impersonateId=' + impersonateId;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.users) {
        setHierarchyData(data.users);
        
        // Generate simple nodes and edges
        const newNodes: Node[] = data.users.map((u: any, i: number) => ({
          id: u.id,
          type: 'custom',
          data: { label: u.name, role: u.designation, department: u.department },
          position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 100 },
        }));

        const newEdges: Edge[] = data.users
          .filter((u: any) => u.managerId && data.users.find((p: any) => p.id === u.managerId))
          .map((u: any) => ({
            id: `e-${u.managerId}-${u.id}`,
            source: u.managerId,
            target: u.id,
            animated: true,
            style: { stroke: '#00C3FF' }
          }));

        setNodes(newNodes);
        setEdges(newEdges);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, [impersonateId, viewMode]);

  const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const handleApproveSelected = () => {
    alert(`Batch Approved ${selectedLeaves.length} requests!`);
    setSelectedLeaves([]);
  };

  if (loading && hierarchyData.length === 0) {
    return <div className="text-center p-8 text-white font-mono animate-pulse">Loading Hierarchy...</div>;
  }

  // Mock pending requests
  const pendingRequests = [
    { id: '1', name: 'John Doe', type: 'Sick Leave', days: 2 },
    { id: '2', name: 'Alice Smith', type: 'Overtime', days: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Impersonation & View Modes */}
      <div className="flex flex-col md:flex-row justify-between gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('department')}
            className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewMode === 'department' ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-white hover:bg-white/10 border border-white/10'}`}
          >
            <Layers size={14} className="inline mr-2" /> Department View
          </button>
          <button 
            onClick={() => setViewMode('squad')}
            className={`px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewMode === 'squad' ? 'bg-purple-500 text-black font-bold' : 'text-white hover:bg-white/10 border border-white/10'}`}
          >
            <Filter size={14} className="inline mr-2" /> Squad View
          </button>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Impersonate:</span>
            <input 
              type="text"
              placeholder="Enter User ID..."
              value={impersonateId}
              onChange={e => setImpersonateId(e.target.value)}
              className="bg-black border border-white/20 rounded px-2 py-1 text-xs font-mono text-white outline-none focus:border-[var(--ledger-blue)]"
            />
            <button className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 text-white">
              <Eye size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <Users className="text-[var(--ledger-blue)]" size={36} />
            Team Hierarchy
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Command center for your organization.
          </p>
        </div>
        
        <button 
          onClick={() => setShowOrgChart(!showOrgChart)}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl font-mono text-xs uppercase tracking-widest transition-colors"
        >
          {showOrgChart ? 'List View' : 'Visual Org Chart'}
        </button>
      </div>

      {/* Manager's Action Hub */}
      {hierarchyData.length > 1 && (
        <div className="bg-white/5 border border-[var(--signal-amber)]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--signal-amber)] to-transparent" />
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <CheckCircle2 className="text-[var(--signal-amber)]" /> Manager's Action Hub
            </h3>
            <button 
              onClick={handleApproveSelected}
              disabled={selectedLeaves.length === 0}
              className="px-4 py-2 bg-[var(--verify-green)] text-black font-bold font-mono text-xs uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            >
              Approve Selected ({selectedLeaves.length})
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer" onClick={() => setSelectedLeaves(prev => prev.includes(req.id) ? prev.filter(id => id !== req.id) : [...prev, req.id])}>
                <input 
                  type="checkbox" 
                  checked={selectedLeaves.includes(req.id)} 
                  readOnly 
                  className="w-4 h-4 accent-[var(--verify-green)]" 
                />
                <div>
                  <p className="text-white font-bold text-sm">{req.name}</p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{req.type} {req.days > 0 ? `(${req.days} days)` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Org Chart or List View */}
      {showOrgChart ? (
        <div className="h-[600px] bg-black/50 border border-white/10 rounded-2xl overflow-hidden relative">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#050505]"
          >
            <Background color="#222" gap={16} />
            <Controls className="bg-black/80 border border-white/20 text-white fill-white" />
          </ReactFlow>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hierarchyData.map((emp: any) => {
            const hasBurnout = Math.random() > 0.8; // Simulating burnout logic

            return (
              <div key={emp.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col group">
                
                {hasBurnout && (
                  <div className="absolute top-2 right-2 flex h-3 w-3" title="High Burnout Risk">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--signal-amber)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--signal-amber)]"></span>
                  </div>
                )}

                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--ledger-blue)]/20 flex items-center justify-center text-[var(--ledger-blue)] font-bold font-mono border border-[var(--ledger-blue)]/30 text-lg">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{emp.name}</h3>
                      <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{emp.designation}</p>
                      <p className="text-[10px] text-[var(--ledger-blue)] font-mono uppercase mt-1">{emp.department}</p>
                    </div>
                  </div>
                </div>

                {/* Heatmap / Burnout Radar */}
                <div className="p-6">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2">
                    <CalendarClock size={12}/> Burnout Radar & Heatmap
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({length: 21}).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-sm ${Math.random() > 0.3 ? 'bg-[var(--verify-green)]' : hasBurnout && i > 15 ? 'bg-[var(--signal-amber)]' : 'bg-black/50 border border-white/10'}`} 
                        title={`Day ${i+1}`}
                      />
                    ))}
                  </div>
                  {hasBurnout && (
                    <p className="text-[10px] font-mono text-[var(--signal-amber)] mt-2 flex items-center gap-1">
                      <AlertTriangle size={12} /> High Overtime Detected
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
