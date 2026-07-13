"use client";

import React, { useState } from 'react';
import { 
  Users, Clock, Target, Calendar, PhoneCall, 
  MessageSquare, UserCircle, CheckCircle2, Check,
  UserPlus, X, Shield, ShieldAlert, CalendarClock
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function TeamDashboardPage() {
  const { data: teamData, isLoading } = trpc.team.getMyTeam.useQuery();

  // Role Simulator Toggle
  const [viewRole, setViewRole] = useState<'Admin' | 'Employee'>('Admin');

  // Modal States
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const directReports = teamData?.directReports || [];
  
  if (isLoading) {
    return <div className="text-center p-8 text-white font-mono animate-pulse">Loading Team Data...</div>;
  }

  // Calculate high-level team metrics
  const totalReports = directReports.length;
  const attendanceRate = totalReports > 0 
    ? Math.round(directReports.filter((e: any) => e.attendances && e.attendances[0]?.status === 'Present').length / totalReports * 100)
    : 0;
  
  const pendingLeaves = directReports.reduce((acc: number, e: any) => acc + (e.leaveRequests?.length || 0), 0);
  
  const avgTeamOkr = totalReports > 0
    ? Math.round(directReports.reduce((acc: number, e: any) => {
        const avgOkr = e.objectives?.length 
          ? e.objectives.reduce((sum: number, o: any) => sum + o.progress, 0) / e.objectives.length
          : 0;
        return acc + avgOkr;
      }, 0) / totalReports)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Role Simulator Toggle (For Testing Only) */}
      <div className="flex items-center justify-end gap-2 p-2 bg-black/40 rounded-xl border border-white/5 w-max ml-auto">
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase mr-2">Simulate Role:</span>
        <button 
          onClick={() => setViewRole('Admin')}
          className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewRole === 'Admin' ? 'bg-[var(--ledger-blue)] text-black font-bold' : 'text-white hover:bg-white/10'}`}
        >
          Admin/Manager
        </button>
        <button 
          onClick={() => setViewRole('Employee')}
          className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${viewRole === 'Employee' ? 'bg-[var(--signal-amber)] text-black font-bold' : 'text-white hover:bg-white/10'}`}
        >
          Employee
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
            <Users className="text-[var(--ledger-blue)]" size={36} />
            {viewRole === 'Admin' ? 'My Team' : 'My Peers'}
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            {viewRole === 'Admin' 
              ? 'Command center for your direct reports and organizational structure.'
              : 'Collaborate and connect with your team members.'}
          </p>
        </div>
        
        {viewRole === 'Admin' && (
          <button 
            onClick={() => setShowProvisionModal(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-[var(--ledger-blue)] rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-colors"
          >
            <UserPlus size={16} />
            Provision Member
          </button>
        )}
      </div>

      {/* Team Analytics Header (Admin Only) */}
      {viewRole === 'Admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--ledger-blue)]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ledger-blue)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2 relative z-10">
              <Users size={12} className="text-[var(--ledger-blue)]" /> Headcount
            </p>
            <p className="text-3xl font-mono font-black text-white relative z-10">{totalReports}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--verify-green)]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--verify-green)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2 relative z-10">
              <CheckCircle2 size={12} className="text-[var(--verify-green)]" /> Today's Attendance
            </p>
            <p className="text-3xl font-mono font-black text-white relative z-10">{attendanceRate}%</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2 relative z-10">
              <Target size={12} className="text-purple-400" /> Avg OKR Progress
            </p>
            <p className="text-3xl font-mono font-black text-white relative z-10">{avgTeamOkr}%</p>
          </div>

          <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group ${pendingLeaves > 0 ? 'hover:border-[var(--signal-amber)]/50' : 'hover:border-white/20'} transition-colors`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${pendingLeaves > 0 ? 'from-[var(--signal-amber)]/10' : 'from-white/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            <p className={`text-[10px] font-mono uppercase tracking-widest ${pendingLeaves > 0 ? 'text-[var(--signal-amber)]' : 'text-[var(--text-muted)]'} mb-2 flex items-center gap-2 relative z-10`}>
              <Calendar size={12} /> Pending Approvals
            </p>
            <p className="text-3xl font-mono font-black text-white relative z-10">{pendingLeaves}</p>
          </div>
        </div>
      )}

      {/* Grid of Team/Peers */}
      {directReports.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-12 font-mono border border-dashed border-white/10 rounded-2xl max-w-4xl mx-auto mt-8">
          You do not have any {viewRole === 'Admin' ? 'direct reports' : 'peers in your team'}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {directReports.map((emp: any) => {
            const avgProgress = emp.objectives?.length 
              ? Math.round(emp.objectives.reduce((acc: number, obj: any) => acc + obj.progress, 0) / emp.objectives.length)
              : 0;

            const isOnline = emp.liveStatus === 'Online';
            const statusColor = isOnline ? 'bg-[var(--verify-green)]' : emp.liveStatus === 'In Meeting' ? 'bg-purple-500' : 'bg-[var(--text-muted)]';

            return (
              <div key={emp.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col group">
                
                {/* Employee Header */}
                <div className="p-6 border-b border-white/5 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-[var(--ledger-blue)]/20 flex items-center justify-center text-[var(--ledger-blue)] font-bold font-mono border border-[var(--ledger-blue)]/30 text-lg">
                          {emp.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${statusColor}`} title={emp.liveStatus} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{emp.name}</h3>
                        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{emp.designation}</p>
                        <p className="text-[10px] text-[var(--ledger-blue)] font-mono uppercase mt-1">{emp.department}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics (Admin Only) */}
                {viewRole === 'Admin' && (
                  <div className="p-6 space-y-5 flex-1">
                    {/* OKRs */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Target size={12}/> Performance</span>
                        <span className="text-xs font-mono text-purple-400">{avgProgress}% avg</span>
                      </div>
                      <div className="w-full bg-black/50 h-1.5 rounded overflow-hidden">
                        <div className="h-full bg-purple-400" style={{ width: `${avgProgress}%` }} />
                      </div>
                    </div>

                    {/* Attendance */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Clock size={12}/> 5-Day Attendance</span>
                      </div>
                      <div className="flex gap-1.5">
                        {emp.attendances?.slice(0, 5).map((att: any, i: number) => (
                          <div 
                            key={i} 
                            title={new Date(att.date).toLocaleDateString() + ' - ' + att.status}
                            className={`flex-1 h-2 rounded ${
                              att.status === 'Present' ? 'bg-[var(--verify-green)]' :
                              att.status === 'Late' ? 'bg-[var(--signal-amber)]' :
                              'bg-[var(--alert-red)]'
                            }`}
                          />
                        ))}
                        {!emp.attendances?.length && <span className="text-xs text-[var(--text-muted)] italic">No records</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions Footer */}
                <div className={`p-4 bg-black/40 border-t border-white/5 grid gap-2 ${viewRole === 'Admin' ? 'grid-cols-3' : 'grid-cols-2 mt-auto'}`}>
                  {viewRole === 'Admin' ? (
                    <button className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-[var(--ledger-blue)]/20 text-[var(--text-muted)] hover:text-[var(--ledger-blue)] transition-colors group/btn">
                      <PhoneCall size={14} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden lg:block">1:1</span>
                    </button>
                  ) : (
                    <button className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[var(--ledger-blue)]/20 hover:bg-[var(--ledger-blue)]/40 text-[var(--ledger-blue)] transition-colors group/btn">
                      <MessageSquare size={14} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden lg:block">Message</span>
                    </button>
                  )}
                  
                  <button className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors group/btn">
                    <UserCircle size={14} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden lg:block">Profile</span>
                  </button>
                  
                  {viewRole === 'Admin' && (
                    emp.leaveRequests?.length > 0 ? (
                      <button 
                        onClick={() => setSelectedLeave({ empName: emp.name, leave: emp.leaveRequests[0] })}
                        className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[var(--signal-amber)]/20 hover:bg-[var(--signal-amber)] text-[var(--signal-amber)] hover:text-black transition-colors group/btn relative"
                      >
                        <Check size={14} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden lg:block">Approve</span>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--signal-amber)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--signal-amber)]"></span>
                        </span>
                      </button>
                    ) : (
                      <button className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 text-[var(--text-muted)] opacity-50 cursor-not-allowed">
                        <Check size={14} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden lg:block">Approve</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Leave Approval Modal --- */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 text-[var(--signal-amber)]">
                <CalendarClock size={24} />
                <h3 className="font-mono font-bold text-xl uppercase tracking-widest text-white">Leave Request</h3>
              </div>
              <button onClick={() => setSelectedLeave(null)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Employee</p>
                <p className="text-lg font-bold text-white">{selectedLeave.empName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Type</p>
                  <p className="text-white font-bold">{selectedLeave.leave.type}</p>
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase mb-1">Duration</p>
                  <p className="text-white font-bold">{selectedLeave.leave.days} Days</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedLeave(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-sm uppercase tracking-widest transition-colors"
              >
                Deny
              </button>
              <button 
                onClick={() => setSelectedLeave(null)}
                className="flex-1 py-3 rounded-xl bg-[var(--verify-green)] text-black font-bold font-mono text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_var(--verify-green)]/30"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Provision Member Modal (Admin Only) --- */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 text-[var(--ledger-blue)]">
                <Shield size={24} />
                <h3 className="font-mono font-bold text-xl uppercase tracking-widest text-white">Provision Access</h3>
              </div>
              <button onClick={() => setShowProvisionModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="bg-[var(--ledger-blue)]/10 border border-[var(--ledger-blue)]/30 p-4 rounded-xl mb-6 flex gap-3">
              <ShieldAlert className="text-[var(--ledger-blue)] shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-[var(--ledger-blue)]">This will generate secure credentials and add the user to your department automatically.</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Full Name</label>
                <input type="text" placeholder="e.g. Sarah Connor" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--ledger-blue)] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Designation</label>
                <input type="text" placeholder="e.g. Senior Frontend Engineer" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--ledger-blue)] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Role Type</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--ledger-blue)] outline-none appearance-none">
                    <option>Employee</option>
                    <option>Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Department</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--ledger-blue)] outline-none appearance-none">
                    <option>Engineering</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>HR</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowProvisionModal(false)}
              className="w-full py-4 rounded-xl bg-white text-black font-bold font-mono text-sm uppercase tracking-widest hover:bg-[var(--ledger-blue)] transition-colors"
            >
              Generate Access Credentials
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
