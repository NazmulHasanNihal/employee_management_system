'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Position, Handle, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Shield, User, ExternalLink, X, ShieldCheck, RefreshCw, UserCheck, Edit3 } from 'lucide-react';
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
}

const CustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as OrgNodeData;
  const isTopRole = d.role === 'CEO' || d.role === 'Admin' || d.role === 'Executive';

  return (
    <div
      className={`group relative w-64 cursor-pointer rounded-2xl border bg-[var(--bg-panel)] p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        isTopRole
          ? 'border-[var(--brand)] shadow-[var(--brand-soft)] ring-2 ring-[var(--brand)]/30'
          : 'border-[var(--border-hairline)] hover:border-[var(--brand)]/60'
      }`}
    >
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

const getSubtreeWidth = (node: TreeNode): number => {
  if (!node.children || node.children.length === 0) return 280;
  let width = 0;
  for (const child of node.children) {
    width += getSubtreeWidth(child);
  }
  return Math.max(280, width);
};

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
    const childY = y + 170;
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

export default function OrgChartFlow({
  tree,
  employees = [],
  canAssignManager = false,
}: {
  tree: TreeNode;
  employees?: Array<{ id: string; name: string; role?: string | null; designation?: string | null; department?: string | null; managerId?: string | null }>;
  canAssignManager?: boolean;
}) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => layoutTree(tree, 0, 40), [tree]);

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [updating, setUpdating] = useState(false);

  // Active inspected profile modal
  const [activeProfileNode, setActiveProfileNode] = useState<OrgNodeData | null>(null);
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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
        {
          designation: editDesignation,
          department: editDepartment,
        },
        activeProfileNode.id
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

  return (
    <div className="flex flex-col space-y-4">
      {/* ── MANAGEMENT ASSIGNMENT BAR ── */}
      {canAssignManager && (
        <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-5 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                {/* @ts-ignore */}<T>Management Selection & Hierarchy Assignment</T>
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
                {/* @ts-ignore */}<T>Save Management Assignment</T>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE REACT-FLOW ORG CHART CANVAS ── */}
      <div className="h-full min-h-[min(70vh,48rem)] flex-1 overflow-hidden rounded-3xl border border-[var(--border-hairline)] shadow-xl relative" style={{ background: 'var(--bg-app)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.1}
          maxZoom={1.8}
          onNodeClick={(_, node) => handleOpenNodeModal(node.data as unknown as OrgNodeData)}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border-hairline)" gap={24} size={1.5} />
          <Controls className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)] !shadow-lg !rounded-2xl" />
          <MiniMap className="!bg-[var(--bg-panel)] !border-[var(--border-hairline)] !rounded-2xl" pannable zoomable />
        </ReactFlow>
      </div>

      {/* ── SELECTED NODE PROFILE DRAWER / MODAL ── */}
      {activeProfileNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveProfileNode(null)}>
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div className="flex items-center gap-3">
                <Avatar src={activeProfileNode.avatarUrl} name={activeProfileNode.name} size="lg" />
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)]">{activeProfileNode.name}</h3>
                  <p className="text-xs text-[var(--brand)] font-semibold">{activeProfileNode.designation || activeProfileNode.role}</p>
                </div>
              </div>
              <button onClick={() => setActiveProfileNode(null)} className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
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
                <span className="text-[var(--text-muted)] font-medium">Direct Subordinates</span>
                <span className="font-bold text-[var(--brand)]">{activeProfileNode.childrenCount} Reports</span>
              </div>
            </div>

            {/* Admin Editing Section inside Node Profile */}
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
