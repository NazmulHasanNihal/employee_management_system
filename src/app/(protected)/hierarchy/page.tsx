"use client";

import React, { useState } from 'react';
import { Network, Building2, Users, DollarSign, Plus, ChevronRight, UserCircle, Briefcase, Hash } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function HierarchyPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'Admin';
  
  const utils = trpc.useUtils();
  const { data: departments, isLoading: deptsLoading } = trpc.departments.getDepartments.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.registry.searchEmployees.useQuery({ query: '' });

  const [viewMode, setViewMode] = useState<'tree' | 'departments'>('tree');
  const [showCreate, setShowCreate] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', budget: 100000, headId: '' });
  const [assignData, setAssignData] = useState({ userId: '', departmentId: '' });

  const createDept = trpc.departments.createDepartment.useMutation({
    onSuccess: () => {
      utils.departments.getDepartments.invalidate();
      setShowCreate(false);
      setNewDept({ name: '', budget: 100000, headId: '' });
    }
  });

  const assignUser = trpc.departments.assignUserToDepartment.useMutation({
    onSuccess: () => {
      utils.departments.getDepartments.invalidate();
      setAssignData({ userId: '', departmentId: '' });
    }
  });

  const updateManager = trpc.registry.updateManager.useMutation({
    onSuccess: () => {
      utils.registry.searchEmployees.invalidate();
    }
  });

  if (deptsLoading || usersLoading) return <div className="p-8 text-center text-white/50 animate-pulse font-mono">Building Hierarchy...</div>;

  // Org-Chart Tree Logic
  // A node is an employee. Children are those who have managerId === node.id
  const getChildren = (managerId: string | null) => {
    return users?.filter((u: any) => u.managerId === managerId) || [];
  };

  const OrgNode = ({ user }: { user: any }) => {
    const children = getChildren(user.id);
    const hasChildren = children.length > 0;

    return (
      <div className="flex flex-col items-center relative">
        {/* Node Card */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl w-48 text-center relative z-10 group hover:border-[var(--ledger-blue)]/50 hover:shadow-[0_0_20px_rgba(0,102,255,0.2)] transition-all">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--ledger-blue)]/20 to-[var(--verify-green)]/20 mx-auto mb-2 flex items-center justify-center border border-white/5">
            <UserCircle size={20} className="text-white" />
          </div>
          <h4 className="font-bold text-sm text-white truncate">{user.name}</h4>
          <p className="text-[10px] font-mono text-[var(--ledger-blue)] truncate uppercase mt-1 tracking-widest">{user.designation || 'Employee'}</p>
          <div className="mt-2 text-[9px] font-mono bg-white/5 rounded border border-white/5 px-2 py-1 text-[var(--text-muted)] truncate flex items-center justify-center gap-1">
            <Briefcase size={10} /> {user.department || 'No Dept'}
          </div>

          {isAdmin && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <select 
                className="bg-black border border-white/20 text-[8px] font-mono p-1 rounded max-w-[60px]"
                value={user.managerId || ''}
                onChange={(e) => updateManager.mutate({ userId: user.id, managerId: e.target.value === '' ? null : e.target.value })}
              >
                <option value="">No Mgr</option>
                {users?.filter((u: any) => u.id !== user.id).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CSS Drawing for Tree Lines */}
        {hasChildren && (
          <>
            {/* Vertical line dropping down from node */}
            <div className="w-px h-8 bg-white/20"></div>
            {/* Horizontal line connecting children */}
            <div className="flex relative pt-4 justify-center">
              {/* The top horizontal bar */}
              <div className="absolute top-0 w-[calc(100%-192px)] h-px bg-white/20"></div>
              
              <div className="flex gap-4">
                {children.map((child: any) => (
                  <div key={child.id} className="relative pt-4">
                    {/* Vertical line dropping to child */}
                    <div className="absolute top-0 left-1/2 -ml-px w-px h-4 bg-white/20"></div>
                    <OrgNode user={child} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const topLevelUsers = getChildren(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-[var(--verify-green)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Network className="text-[var(--ledger-blue)]" size={28} /> Organization
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            Company Hierarchy & Budgets
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('tree')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-widest transition-colors ${viewMode === 'tree' ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Tree View
            </button>
            <button 
              onClick={() => setViewMode('departments')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-widest transition-colors ${viewMode === 'departments' ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Departments
            </button>
          </div>
          {isAdmin && viewMode === 'departments' && (
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-white/5 border border-white/10 text-white px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 rounded-lg"
            >
              <Plus size={14} /> {showCreate ? 'Cancel' : 'New Dept'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative p-4">
        
        {viewMode === 'tree' && (
          <div className="min-w-max flex justify-center py-12">
            <div className="flex gap-8">
              {topLevelUsers.map((user: any) => (
                <OrgNode key={user.id} user={user} />
              ))}
              {topLevelUsers.length === 0 && (
                <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                  No Users Found
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'departments' && (
          <div className="space-y-6">
            {showCreate && isAdmin && (
              <div className="bg-white/5 backdrop-blur-lg border border-[var(--ledger-blue)]/50 p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4">
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); createDept.mutate(newDept); }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Department Name</label>
                      <input 
                        type="text" required placeholder="Engineering"
                        value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Quarterly Budget ($)</label>
                      <input 
                        type="number" required 
                        value={newDept.budget} onChange={e => setNewDept({...newDept, budget: parseInt(e.target.value)})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Department Head</label>
                      <select 
                        value={newDept.headId} onChange={e => setNewDept({...newDept, headId: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--ledger-blue)] appearance-none"
                      >
                        <option value="">None</option>
                        {users?.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button disabled={createDept.isPending} type="submit" className="bg-[var(--ledger-blue)] text-black px-6 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_15px_var(--ledger-blue)] transition-all">
                    Establish Department
                  </button>
                </form>
              </div>
            )}

            {isAdmin && (
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                  Assign Employee to Department:
                </div>
                <select 
                  value={assignData.userId} onChange={e => setAssignData({...assignData, userId: e.target.value})}
                  className="bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-mono text-white flex-1"
                >
                  <option value="">Select Employee...</option>
                  {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name} (Current: {u.department || 'None'})</option>)}
                </select>
                <ChevronRight size={14} className="text-white/50" />
                <select 
                  value={assignData.departmentId} onChange={e => setAssignData({...assignData, departmentId: e.target.value})}
                  className="bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-mono text-white flex-1"
                >
                  <option value="">Select Department...</option>
                  {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button 
                  disabled={!assignData.userId || !assignData.departmentId || assignUser.isPending}
                  onClick={() => assignUser.mutate(assignData)}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-mono uppercase hover:bg-white/20 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments?.map((dept: any) => (
                <div key={dept.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative group overflow-hidden hover:border-[var(--ledger-blue)]/30 transition-colors shadow-lg flex flex-col">
                  <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110 duration-500 text-white">
                    <Building2 size={150} />
                  </div>
                  
                  <div className="relative z-10 flex-1">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{dept.name}</h3>
                      <p className="text-xs font-mono text-[var(--ledger-blue)] flex items-center gap-1">
                        Head: {dept.head?.name || 'Unassigned'}
                      </p>
                    </div>

                    <div className="space-y-4 border-l-2 border-[var(--verify-green)]/50 pl-4 py-2 mb-6">
                      <div>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1"><DollarSign size={10} /> Budget Allocation</p>
                        <p className="text-lg font-mono text-[var(--verify-green)]">${dept.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1"><Users size={10} /> Headcount</p>
                        <p className="text-lg font-mono text-white">{dept.users.length}</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5">
                      <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1"><Hash size={10} /> Team Roster</p>
                      <div className="flex flex-wrap gap-2">
                        {dept.users.slice(0, 5).map((u: any) => (
                          <div key={u.id} className="bg-black/40 border border-white/10 px-2 py-1 rounded text-xs font-mono text-white/80 flex items-center gap-1">
                            <UserCircle size={10} className="text-[var(--ledger-blue)]" /> {u.name}
                          </div>
                        ))}
                        {dept.users.length > 5 && (
                          <div className="bg-black/40 border border-[var(--ledger-blue)]/30 text-[var(--ledger-blue)] px-2 py-1 rounded text-xs font-mono">
                            +{dept.users.length - 5} more
                          </div>
                        )}
                        {dept.users.length === 0 && (
                          <span className="text-xs font-mono text-white/30 italic">Empty</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!departments || departments.length === 0) && (
                <div className="col-span-full py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl">
                  No departments found. Create one to build the organization hierarchy.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
