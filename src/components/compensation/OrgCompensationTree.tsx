'use client';

import React, { useState } from 'react';
import { isSalaryExempt } from '@/lib/hierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  User,
  Crown,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react';

export interface OrgNode {
  id: string;
  name: string;
  role?: string | null;
  department?: string | null;
  designation?: string | null;
  baseSalary?: number | null;
  managerId?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

interface Props {
  employees: OrgNode[];
  onSelectEmployeeForAdjustment?: (employee: OrgNode) => void;
  canManageCompensation?: boolean;
}

interface TreeNode extends OrgNode {
  subordinates: TreeNode[];
}

export function OrgCompensationTree({
  employees = [],
  onSelectEmployeeForAdjustment,
  canManageCompensation = true,
}: Props) {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Build hierarchy tree
  const buildTree = (): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize nodes
    safeEmployees.forEach((emp) => {
      nodeMap.set(emp.id, { ...emp, subordinates: [] });
    });

    // Connect subordinates to parent
    safeEmployees.forEach((emp) => {
      const node = nodeMap.get(emp.id)!;
      if (emp.managerId && nodeMap.has(emp.managerId)) {
        nodeMap.get(emp.managerId)!.subordinates.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const roots = buildTree();

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? true : !prev[id],
    }));
  };

  const matchesSearch = (node: TreeNode): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (node.name || '').toLowerCase().includes(q);
    const roleMatch = (node.role || '').toLowerCase().includes(q);
    const deptMatch = (node.department || '').toLowerCase().includes(q);
    const subMatch = (node.subordinates || []).some((sub) => matchesSearch(sub));
    return nameMatch || roleMatch || deptMatch || subMatch;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (!matchesSearch(node)) return null;

    const isExempt = isSalaryExempt(node.role || '');
    const isExpanded = expandedNodes[node.id] !== false; // Default expanded
    const hasSubordinates = (node.subordinates || []).length > 0;
    const isCeo = (node.role || '').toUpperCase() === 'CEO';

    return (
      <div key={node.id} className="relative ml-2 sm:ml-6 my-2">
        {/* Connector line for child nodes */}
        {depth > 0 && (
          <div className="absolute -left-4 sm:-left-6 top-5 w-4 sm:w-6 h-px bg-slate-800" />
        )}

        <div
          className={`group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
            isCeo
              ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
              : depth === 1
              ? 'bg-slate-900/90 border-indigo-500/30 hover:border-indigo-500/60'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Left info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {hasSubordinates ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-slate-600 font-mono text-xs">
                •
              </div>
            )}

            <div className="relative">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
                  isCeo
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isExempt
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isCeo ? <Crown className="w-4 h-4 text-amber-400" /> : node.name.charAt(0)}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-100 text-sm">{node.name}</span>
                {isCeo && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0">
                    CEO / Top Executive
                  </Badge>
                )}
                {isExempt && !isCeo && (
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-1.5 py-0">
                    Salary Exempt
                  </Badge>
                )}
                {node.department && (
                  <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {node.department}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {node.role || node.designation || 'Team Member'}
                {hasSubordinates && (
                  <span className="text-slate-500 ml-2">
                    ({node.subordinates.length} direct {node.subordinates.length === 1 ? 'report' : 'reports'})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right salary & action */}
          <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
            <div className="text-right">
              {isExempt ? (
                <div className="flex items-center justify-end gap-1 text-amber-400 text-xs font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Salary Exempt</span>
                </div>
              ) : (
                <>
                  <div className="text-sm font-semibold text-emerald-400">
                    ৳{(node.baseSalary || 0).toLocaleString()} <span className="text-[10px] text-slate-500">/ mo</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Annual: ৳{((node.baseSalary || 0) * 12).toLocaleString()}
                  </div>
                </>
              )}
            </div>

            {canManageCompensation && !isExempt && onSelectEmployeeForAdjustment && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectEmployeeForAdjustment(node)}
                className="h-8 px-2.5 text-xs bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border-slate-700 text-slate-200 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                Adjust Salary
              </Button>
            )}
          </div>
        </div>

        {/* Render child tree recursively */}
        {hasSubordinates && isExpanded && (
          <div className="relative pl-2 sm:pl-4 border-l border-slate-800 mt-1">
            {node.subordinates.map((sub) => renderNode(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-slate-950 border-slate-800 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Organizational Compensation Hierarchy
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Hierarchical salary structure. Top leadership sets compensation for executive direct reports, down the reporting chain.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter by name, role, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-900 border-slate-800 text-slate-200"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {roots.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No organizational hierarchy nodes found.
          </div>
        ) : (
          <div className="space-y-1">
            {roots.map((root) => renderNode(root, 0))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
