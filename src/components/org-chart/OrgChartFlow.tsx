'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  NodeProps,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Shield,
  ExternalLink,
  X,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Edit3,
  Network,
  Search,
  ChevronDown,
  ChevronRight,
  Crown,
  Star,
  Users,
  Briefcase,
  ZoomIn,
  Minimize2,
} from 'lucide-react';
import { updateProfileField, updateProfileBatch } from '@/app/actions/profile';
import { toast } from '@/lib/toast';
import { T } from '@/components/Translate';

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
  level: number;
  isCollapsed: boolean;
  totalDescendants: number;
}

// ─── Level-based color scheme ───
const LEVEL_COLORS: Record<number, { bg: string; border: string; badge: string; gradient: string; edge: string }> = {
  0: { bg: 'from-amber-500/20 to-yellow-500/10', border: '#f59e0b', badge: 'bg-amber-500', gradient: 'from-amber-400 to-yellow-500', edge: '#f59e0b' },
  1: { bg: 'from-violet-500/20 to-purple-500/10', border: '#8b5cf6', badge: 'bg-violet-500', gradient: 'from-violet-400 to-purple-500', edge: '#8b5cf6' },
  2: { bg: 'from-emerald-500/15 to-green-500/10', border: '#10b981', badge: 'bg-emerald-500', gradient: 'from-emerald-400 to-green-500', edge: '#10b981' },
  3: { bg: 'from-blue-500/15 to-indigo-500/10', border: '#3b82f6', badge: 'bg-blue-500', gradient: 'from-blue-400 to-indigo-500', edge: '#3b82f6' },
  4: { bg: 'from-cyan-500/10 to-sky-500/10', border: '#06b6d4', badge: 'bg-cyan-500', gradient: 'from-cyan-400 to-sky-500', edge: '#06b6d4' },
  5: { bg: 'from-slate-500/10 to-gray-500/5', border: '#64748b', badge: 'bg-slate-500', gradient: 'from-slate-400 to-gray-500', edge: '#94a3b8' },
};

const LEVEL_LABELS = ['CEO', 'C-Suite', 'Director', 'Manager', 'Team Lead', 'Staff'];
const LEVEL_ICONS = [Crown, Star, Shield, Briefcase, Users, Users];

function getColors(level: number) {
  return LEVEL_COLORS[Math.min(level, 5)] || LEVEL_COLORS[5];
}

function countDescendants(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 0;
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

// ─── Custom Node ───
const CustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as OrgNodeData;
  const colors = getColors(d.level);
  const LevelIcon = LEVEL_ICONS[Math.min(d.level, 5)];

  return (
    <div
      className={`group relative cursor-pointer rounded-2xl border-2 bg-[var(--bg-panel)] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        d.level === 0 ? 'w-72 p-5' : d.level <= 2 ? 'w-64 p-4' : 'w-56 p-3'
      }`}
      style={{
        borderColor: colors.border,
        boxShadow: `0 4px 20px ${colors.border}25`,
      }}
    >
      {/* Top handle */}
      {d.level > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-[var(--bg-panel)] shadow-md"
          style={{ background: colors.border }}
        />
      )}

      {/* Level ribbon */}
      <div
        className="absolute -top-3 left-4 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${colors.border}, ${colors.border}dd)` }}
      >
        {LEVEL_LABELS[Math.min(d.level, 5)]}
      </div>

      <div className="mt-1 flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar src={d.avatarUrl} name={d.name} size={d.level === 0 ? 'lg' : 'md'} />
          <div
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow"
            style={{ background: colors.border }}
          >
            <LevelIcon size={9} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`truncate font-extrabold text-[var(--text-main)] group-hover:text-[var(--brand)] transition-colors ${
            d.level === 0 ? 'text-sm' : 'text-xs'
          }`}>
            {d.name}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-bold" style={{ color: colors.border }}>
            {d.designation || d.role || 'Team Member'}
          </div>
          {d.department && (
            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--text-muted)] truncate font-medium">
              <Building2 size={9} className="shrink-0" />
              <span className="truncate">{d.department}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subordinate count & collapse indicator */}
      {d.childrenCount > 0 && (
        <div className="mt-2 flex items-center justify-between border-t border-[var(--border-hairline)] pt-1.5 text-[9px] font-bold text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Users size={10} />
            {d.childrenCount} direct · {d.totalDescendants} total
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-black text-white shadow-sm text-[8px]"
            style={{ background: colors.border }}
          >
            {d.isCollapsed ? '▶ Expand' : '▼'}
          </span>
        </div>
      )}

      {/* Bottom handle */}
      {d.childrenCount > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-[var(--bg-panel)] shadow-md"
          style={{ background: colors.border }}
        />
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

// ─── Tree Layout Algorithm ───
const NODE_WIDTHS = [300, 280, 260, 240, 230, 220];
const VERTICAL_GAPS = [250, 220, 200, 180, 160, 150];
const HORIZONTAL_GAP = 30;

function getNodeWidth(level: number): number {
  return NODE_WIDTHS[Math.min(level, 5)];
}

function getVerticalGap(level: number): number {
  return VERTICAL_GAPS[Math.min(level, 5)];
}

function getSubtreeWidth(node: TreeNode, level: number, collapsedIds: Set<string>): number {
  if (!node.children || node.children.length === 0 || collapsedIds.has(node.id)) {
    return getNodeWidth(level) + HORIZONTAL_GAP;
  }
  let width = 0;
  for (const child of node.children) {
    width += getSubtreeWidth(child, level + 1, collapsedIds);
  }
  return Math.max(getNodeWidth(level) + HORIZONTAL_GAP, width);
}

function layoutTree(
  treeNode: TreeNode,
  x: number,
  y: number,
  level: number,
  collapsedIds: Set<string>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (!treeNode) return { nodes, edges };

  const nodeId = treeNode.id;
  const colors = getColors(level);
  const isCollapsed = collapsedIds.has(treeNode.id);
  const totalDesc = countDescendants(treeNode);

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
      level,
      isCollapsed,
      totalDescendants: totalDesc,
    },
  });

  if (treeNode.children && treeNode.children.length > 0 && !isCollapsed) {
    const childY = y + getVerticalGap(level);
    const totalSubtreeWidth = getSubtreeWidth(treeNode, level, collapsedIds);
    let currentX = x - totalSubtreeWidth / 2;

    treeNode.children.forEach((child) => {
      const childWidth = getSubtreeWidth(child, level + 1, collapsedIds);
      const childX = currentX + childWidth / 2;
      currentX += childWidth;

      const childData = layoutTree(child, childX, childY, level + 1, collapsedIds);
      const childNodeId = childData.nodes[0]?.id;
      if (childNodeId) {
        edges.push({
          id: `e-${nodeId}-${childNodeId}`,
          source: nodeId,
          target: childNodeId,
          type: 'bezier',
          animated: level < 2,
          style: {
            stroke: colors.edge,
            strokeWidth: Math.max(2, 4 - level * 0.5),
          },
        });
      }
      nodes.push(...childData.nodes);
      edges.push(...childData.edges);
    });
  }
  return { nodes, edges };
}

// ─── Search helper: find node in tree ───
function findNodeInTree(tree: TreeNode, id: string): TreeNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children || []) {
    const found = findNodeInTree(child, id);
    if (found) return found;
  }
  return null;
}

function getAncestorIds(tree: TreeNode, targetId: string): string[] {
  const path: string[] = [];
  function dfs(node: TreeNode): boolean {
    if (node.id === targetId) return true;
    for (const child of node.children || []) {
      if (dfs(child)) {
        path.push(node.id);
        return true;
      }
    }
    return false;
  }
  dfs(tree);
  return path;
}

// ─── Inner Flow Component (needs ReactFlowProvider) ───
function OrgChartFlowInner({
  tree,
  employees = [],
  canAssignManager = false,
}: {
  tree: TreeNode;
  employees?: Array<{ id: string; name: string; role?: string | null; designation?: string | null; department?: string | null; managerId?: string | null }>;
  canAssignManager?: boolean;
}) {
  const router = useRouter();
  const { fitView, setCenter } = useReactFlow();

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeProfileNode, setActiveProfileNode] = useState<OrgNodeData | null>(null);
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const { nodes, edges } = useMemo(
    () => layoutTree(tree, 0, 40, 0, collapsedIds),
    [tree, collapsedIds],
  );

  // ─── Stats ───
  const totalNodes = useMemo(() => {
    function count(n: TreeNode): number {
      return 1 + (n.children || []).reduce((s, c) => s + count(c), 0);
    }
    return count(tree);
  }, [tree]);

  // ─── Search results ───
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.designation || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q),
    ).slice(0, 8);
  }, [searchQuery, employees]);

  const handleSearchSelect = useCallback((empId: string) => {
    // Expand all ancestors so the node is visible
    const ancestors = getAncestorIds(tree, empId);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      for (const id of ancestors) next.delete(id);
      return next;
    });
    setSearchQuery('');

    // Zoom to the node after a small delay for layout to settle
    setTimeout(() => {
      const targetNode = nodes.find((n) => n.id === empId);
      if (targetNode) {
        setCenter(targetNode.position.x + 130, targetNode.position.y + 60, { zoom: 1.2, duration: 800 });
      }
    }, 300);
  }, [tree, nodes, setCenter]);

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((_: any, node: any) => {
    const d = node.data as unknown as OrgNodeData;
    if (d.childrenCount > 0) {
      toggleCollapse(d.id);
    } else {
      handleOpenNodeModal(d);
    }
  }, [toggleCollapse]);

  const handleNodeDoubleClick = useCallback((_: any, node: any) => {
    const d = node.data as unknown as OrgNodeData;
    handleOpenNodeModal(d);
  }, []);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);

  const handleEmpChange = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    setSelectedManagerId(emp?.managerId || '');
  };

  const handleUpdateManager = async () => {
    if (!selectedEmpId) {
      toast.error('Selection Required', 'Please select an employee to update.');
      return;
    }
    setUpdating(true);
    try {
      const newMgr = selectedManagerId === 'NONE' || selectedManagerId === '' ? null : selectedManagerId;
      await updateProfileField('managerId', newMgr, selectedEmpId);
      const empName = selectedEmp?.name || 'Employee';
      const mgrName = employees.find((e) => e.id === newMgr)?.name || 'Top Level / Unassigned';
      toast.success('Manager Updated', `${empName} now reports to ${mgrName}.`);
      router.refresh();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update manager assignment.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenNodeModal = (nodeData: OrgNodeData) => {
    setActiveProfileNode(nodeData);
    setEditDesignation(nodeData.designation || '');
    setEditDepartment(nodeData.department || '');
  };

  const handleSaveNodeEdits = async () => {
    if (!activeProfileNode) return;
    setEditSaving(true);
    try {
      await updateProfileBatch(
        { designation: editDesignation, department: editDepartment },
        activeProfileNode.id,
      );
      toast.success('Profile Updated', `${activeProfileNode.name}'s profile details updated successfully.`);
      setActiveProfileNode(null);
      router.refresh();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update user details.');
    } finally {
      setEditSaving(false);
    }
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseToLevel2 = () => {
    // Collapse everything below level 2
    const ids = new Set<string>();
    function walk(node: TreeNode, level: number) {
      if (level >= 2 && node.children && node.children.length > 0) {
        ids.add(node.id);
      }
      for (const child of node.children || []) {
        walk(child, level + 1);
      }
    }
    walk(tree, 0);
    setCollapsedIds(ids);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* ── MANAGEMENT ASSIGNMENT (Admin Only) ── */}
      {canAssignManager && (
        <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-5 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                {/* @ts-ignore */}<T>Hierarchy Assignment</T>
              </h3>
            </div>
            <span className="text-xs font-semibold text-[var(--brand)]">
              {/* @ts-ignore */}<T>CEO / Admin / HR Clearance</T>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {/* @ts-ignore */}<T>Select Target Employee</T>
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => handleEmpChange(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)]"
              >
                <option value="">{/* @ts-ignore */}<T>Choose Employee...</T></option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation || emp.role || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {/* @ts-ignore */}<T>Assign Reporting Manager</T>
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                disabled={!selectedEmpId}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50"
              >
                <option value="NONE">{/* @ts-ignore */}<T>None (Top Executive / Unassigned)</T></option>
                {employees
                  .filter((e) => e.id !== selectedEmpId)
                  .map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.designation || mgr.role || 'Leader'})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Button
                variant="primary"
                onClick={handleUpdateManager}
                disabled={updating || !selectedEmpId}
                className="w-full rounded-xl flex items-center justify-center gap-2"
              >
                {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                {/* @ts-ignore */}<T>Save Assignment</T>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-3 shadow-md text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-[var(--brand)]" />
            <span className="font-extrabold uppercase tracking-wider text-[var(--text-main)]">
              {/* @ts-ignore */}<T>Organization Chart</T>
            </span>
          </div>
          <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold text-white">
            {totalNodes} people
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-app)] py-2 pl-9 pr-3 text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--brand)] placeholder:text-[var(--text-muted)]"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-xl">
              {searchResults.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSearchSelect(emp.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="font-bold text-[var(--text-main)]">{emp.name}</span>
                  <span className="text-[var(--text-muted)]">· {emp.designation || emp.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 rounded-lg bg-[var(--bg-hover)] px-2.5 py-1.5 font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Expand All"
          >
            <ChevronDown size={12} /> Expand
          </button>
          <button
            onClick={collapseToLevel2}
            className="flex items-center gap-1 rounded-lg bg-[var(--bg-hover)] px-2.5 py-1.5 font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Collapse to Directors"
          >
            <ChevronRight size={12} /> Compact
          </button>
          <button
            onClick={() => fitView({ duration: 500, padding: 0.15 })}
            className="flex items-center gap-1 rounded-lg bg-[var(--bg-hover)] px-2.5 py-1.5 font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Fit to screen"
          >
            <Minimize2 size={12} /> Fit
          </button>
        </div>
      </div>

      {/* ── LEVEL LEGEND ── */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        {LEVEL_LABELS.map((label, i) => {
          const colors = getColors(i);
          return (
            <div key={label} className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.border }} />
              {label}
            </div>
          );
        })}
        <span className="ml-2 text-[10px] text-[var(--text-muted)] italic">
          Click node = expand/collapse · Double-click = view profile
        </span>
      </div>

      {/* ── REACT FLOW CANVAS ── */}
      <div
        className="h-full min-h-[min(80vh,55rem)] flex-1 overflow-hidden rounded-3xl border border-[var(--border-hairline)] shadow-2xl relative"
        style={{ background: 'var(--bg-app)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.05}
          maxZoom={2}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border-hairline)" gap={24} size={1.5} />
          <Controls className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)] !shadow-lg !rounded-2xl" />
          <MiniMap
            className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)] !rounded-2xl"
            pannable
            zoomable
            nodeColor={(n) => {
              const level = (n.data as any)?.level ?? 5;
              return getColors(level).border;
            }}
          />
        </ReactFlow>
      </div>

      {/* ── PROFILE MODAL ── */}
      {activeProfileNode && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setActiveProfileNode(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto my-auto rounded-2xl border bg-[var(--bg-panel)] p-4 sm:p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 custom-scrollbar"
            style={{ borderColor: getColors(activeProfileNode.level).border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-3">
                <Avatar src={activeProfileNode.avatarUrl} name={activeProfileNode.name} size="lg" />
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">{activeProfileNode.name}</h3>
                  <p className="text-xs font-bold" style={{ color: getColors(activeProfileNode.level).border }}>
                    {activeProfileNode.designation || activeProfileNode.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveProfileNode(null)}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Department</span>
                <Badge variant="secondary">{activeProfileNode.department || 'General'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">System Role</span>
                <Badge variant="brand">{activeProfileNode.role || 'Employee'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Hierarchy Level</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: getColors(activeProfileNode.level).border }}
                >
                  {LEVEL_LABELS[Math.min(activeProfileNode.level, 5)]}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Direct Reports</span>
                <span className="font-bold" style={{ color: getColors(activeProfileNode.level).border }}>
                  {activeProfileNode.childrenCount} Reports
                </span>
              </div>
            </div>

            {/* Admin Editing */}
            {canAssignManager && (
              <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand)] uppercase tracking-wider">
                  <Edit3 size={14} /> {/* @ts-ignore */}<T>Admin Direct Profile Edit</T>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Designation</label>
                  <Input
                    value={editDesignation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDesignation(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                    placeholder="e.g. Lead Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Department</label>
                  <Input
                    value={editDepartment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDepartment(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleSaveNodeEdits}
                  disabled={editSaving}
                  className="w-full rounded-xl"
                >
                  {editSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveProfileNode(null)}
                className="flex-1 rounded-xl"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push(`/profile?id=${activeProfileNode.id}`)}
                className="flex-1 rounded-xl flex items-center justify-center gap-2"
              >
                <span>View Full Profile</span>
                <ExternalLink size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wrapper with Provider ───
export default function OrgChartFlow(props: {
  tree: TreeNode;
  employees?: Array<{ id: string; name: string; role?: string | null; designation?: string | null; department?: string | null; managerId?: string | null }>;
  canAssignManager?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <OrgChartFlowInner {...props} />
    </ReactFlowProvider>
  );
}
