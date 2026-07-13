"use client";

import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, XCircle, 
  Umbrella, Plus, Syringe, UserCircle2, ShieldAlert
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

export default function LeavePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const [type, setType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const { data: requests, isLoading } = trpc.leave.getRequests.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();
  
  const submitRequest = trpc.leave.submitRequest.useMutation({
    onSuccess: () => {
      utils.leave.getRequests.invalidate();
      setStartDate('');
      setEndDate('');
      setReason('');
    }
  });

  const updateStatus = trpc.leave.updateStatus.useMutation({
    onSuccess: () => utils.leave.getRequests.invalidate()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;
    submitRequest.mutate({ type, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), reason });
  };

  if (!user || isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Loading Leave Data...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-[var(--ledger-blue)]/10 blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Umbrella className="text-purple-400" size={36} />
            Leave Management
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            PTO Balances, Accruals, and Request Tracking.
          </p>
        </div>
      </div>

      {/* PTO Balances Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--ledger-blue)]/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--ledger-blue)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <Umbrella size={14} className="text-[var(--ledger-blue)]" /> Vacation Days
          </h4>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-mono font-black text-white">14</span>
            <span className="text-sm font-mono text-[var(--text-muted)] uppercase mb-1">Available</span>
          </div>
          <div className="w-full bg-black/50 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-[var(--ledger-blue)] h-full w-[70%]" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--signal-amber)]/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--signal-amber)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <Syringe size={14} className="text-[var(--signal-amber)]" /> Sick Leave
          </h4>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-mono font-black text-white">05</span>
            <span className="text-sm font-mono text-[var(--text-muted)] uppercase mb-1">Available</span>
          </div>
          <div className="w-full bg-black/50 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-[var(--signal-amber)] h-full w-[40%]" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <UserCircle2 size={14} className="text-purple-400" /> Personal Days
          </h4>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-mono font-black text-white">02</span>
            <span className="text-sm font-mono text-[var(--text-muted)] uppercase mb-1">Available</span>
          </div>
          <div className="w-full bg-black/50 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full w-[20%]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Request Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus size={14} className="text-[var(--verify-green)]" /> File New Request
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Leave Category</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors appearance-none"
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick</option>
                  <option value="Personal">Personal</option>
                  <option value="Maternity/Paternity">Maternity/Paternity</option>
                  <option value="Bereavement">Bereavement</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Start Date</label>
                  <input 
                    type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">End Date</label>
                  <input 
                    type="date" required value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Reason (Required)</label>
                <textarea 
                  required value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Please provide details for your absence..."
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--ledger-blue)] outline-none transition-colors resize-none custom-scrollbar"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitRequest.isPending || !startDate || !endDate || !reason}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-widest font-bold transition-all duration-300 bg-[var(--verify-green)] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,255,100,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {submitRequest.isPending ? 'Filing...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: History Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative shadow-xl flex flex-col h-[525px]">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={14} className="text-[var(--text-muted)]" /> Request History
            </h4>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {requests?.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                  <ShieldAlert size={32} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
                  <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Leave History</h3>
                </div>
              ) : (
                requests?.map(req => (
                  <div key={req.id} className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${
                        req.type === 'Sick' ? 'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30' :
                        req.type === 'Personal' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        'bg-[var(--ledger-blue)]/10 text-[var(--ledger-blue)] border-[var(--ledger-blue)]/30'
                      }`}>
                        {req.type === 'Sick' ? <Syringe size={20} /> :
                         req.type === 'Personal' ? <UserCircle2 size={20} /> :
                         <Umbrella size={20} />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-bold text-white text-sm">{req.type} Leave</h5>
                          
                          {/* Status Badge */}
                          <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            req.status === 'Approved' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30 shadow-[0_0_10px_rgba(0,255,100,0.2)]' :
                            req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(255,0,0,0.2)]' :
                            'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30 shadow-[0_0_10px_var(--signal-amber)] animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        
                        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-2">
                          {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-2 italic font-sans leading-relaxed">"{req.reason}"</p>
                        {isAdmin && (
                          <p className="text-[10px] font-mono text-[var(--ledger-blue)] uppercase mt-2">Requested By: {req.userName}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Admin Actions */}
                    {isAdmin && req.status === 'Pending' && (
                      <div className="flex gap-2 shrink-0 border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
                        <button 
                          onClick={() => updateStatus.mutate({ id: req.id, status: 'Approved' })}
                          className="bg-[var(--verify-green)]/20 text-[var(--verify-green)] border border-[var(--verify-green)]/30 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--verify-green)] hover:text-black transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button 
                          onClick={() => updateStatus.mutate({ id: req.id, status: 'Rejected' })}
                          className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
