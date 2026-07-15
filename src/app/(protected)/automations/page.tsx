"use client";

import React, { useState } from 'react';
import { Play, Pause, Plus, Zap, Cpu, Search, Trash2, ArrowRight, Settings, Check } from 'lucide-react';

export default function AutomationsPage() {
  
  // Local state for mocking automation engine
  const [rules, setRules] = useState([
    { id: 'rule1', name: 'New Hire Onboarding', condition: 'When Employee is Added', action: 'Send Welcome Packet & Slack Invite', status: 'Active' },
    { id: 'rule2', name: 'Performance Review Ping', condition: 'If Date is Dec 1', action: 'Notify Managers to start Q4 Reviews', status: 'Paused' },
    { id: 'rule3', name: 'Automated Leave Approval', condition: 'If Leave Request < 3 Days', action: 'Auto-Approve & Notify Manager', status: 'Active' }
  ]);
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', condition: '', action: '' });

  const toggleStatus = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const saveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.condition || !newRule.action) return;
    setRules([{ id: Date.now().toString(), name: newRule.name, condition: newRule.condition, action: newRule.action, status: 'Active' }, ...rules]);
    setShowBuilder(false);
    setNewRule({ name: '', condition: '', action: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Cpu className="text-purple-500" size={36} />
            Automation Engine
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Configure logical IF/THEN workflows to automate HR operations.
          </p>
        </div>
        <button 
          onClick={() => setShowBuilder(!showBuilder)}
          className="mt-6 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2"
        >
          {showBuilder ? 'Cancel Workflow' : <><Plus size={16} /> Build Workflow</>}
        </button>
      </div>

      {showBuilder && (
        <div className="bg-[#0a0a0a] border border-purple-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <h3 className="font-mono text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4 mb-6 relative z-10">
            <Zap className="text-purple-400" size={24} /> Logic Builder
          </h3>
          
          <form className="space-y-8 relative z-10" onSubmit={saveRule}>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Workflow Name</label>
              <input 
                type="text" required placeholder="e.g. Birthday Notifier"
                value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-base font-mono text-white focus:border-purple-500 outline-none transition-colors shadow-inner"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/5 p-6 rounded-2xl border border-white/10">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center font-black font-mono">1</div>
                  <h4 className="font-mono font-bold uppercase tracking-widest text-sm">Trigger (IF)</h4>
                </div>
                <select 
                  required value={newRule.condition} onChange={e => setNewRule({...newRule, condition: e.target.value})}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-4 text-sm font-mono text-white focus:border-purple-500 outline-none appearance-none transition-colors"
                >
                  <option value="">Select Trigger Condition...</option>
                  <option value="When Employee is Added">When New Employee is Added</option>
                  <option value="If Leave Request < 3 Days">If Leave Request is under 3 days</option>
                  <option value="If Performance Review Overdue">If Performance Review is overdue</option>
                  <option value="On First of Month">Time-based: First of the month</option>
                </select>
              </div>

              <div className="hidden md:flex justify-center -mx-4 z-10">
                <div className="bg-black border border-white/10 p-3 rounded-full text-[var(--text-muted)]">
                  <ArrowRight size={24} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center font-black font-mono">2</div>
                  <h4 className="font-mono font-bold uppercase tracking-widest text-sm">Action (THEN)</h4>
                </div>
                <select 
                  required value={newRule.action} onChange={e => setNewRule({...newRule, action: e.target.value})}
                  className="w-full bg-black/60 border border-cyan-500/30 rounded-xl p-4 text-sm font-mono text-white focus:border-cyan-500 outline-none appearance-none transition-colors"
                >
                  <option value="">Select Executable Action...</option>
                  <option value="Send Welcome Packet & Slack Invite">Send Welcome Packet & Slack Invite</option>
                  <option value="Auto-Approve & Notify Manager">Auto-Approve & Notify Manager</option>
                  <option value="Send Escalation Email to HR">Send Escalation Email to HR</option>
                  <option value="Generate Compliance Report">Generate Compliance Report</option>
                </select>
              </div>

            </div>

            <button 
              disabled={!newRule.name || !newRule.condition || !newRule.action} type="submit" 
              className="w-full bg-purple-600 text-white px-6 py-4 rounded-xl font-black font-mono text-sm uppercase tracking-widest hover:brightness-110 shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Check size={20} /> Compile & Deploy Workflow
            </button>
          </form>
        </div>
      )}

      {/* Rules Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
            <Settings size={16} className="text-purple-400" /> Active Logic Matrix
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
            <input 
              type="text" placeholder="Search rules..." 
              className="bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white focus:border-purple-500 outline-none w-64 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {rules.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
              <Zap size={48} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
              <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Logic Engine Offline. No Rules Configured.</h3>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-colors rounded-3xl p-6 relative overflow-hidden group shadow-lg">
                <div className={`absolute top-0 right-0 w-1.5 h-full opacity-50 ${rule.status === 'Active' ? 'bg-gradient-to-b from-[var(--verify-green)] to-transparent' : 'bg-gradient-to-b from-[var(--signal-amber)] to-transparent'}`} />
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-white text-lg font-mono mb-1">{rule.name}</h4>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">UUID: {rule.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleStatus(rule.id)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                        rule.status === 'Active' ? 'bg-[var(--verify-green)]/10 border-[var(--verify-green)]/30 text-[var(--verify-green)] hover:bg-[var(--verify-green)] hover:text-black' : 
                        'bg-[var(--signal-amber)]/10 border-[var(--signal-amber)]/30 text-[var(--signal-amber)] hover:bg-[var(--signal-amber)] hover:text-black'
                      }`}
                      title={rule.status === 'Active' ? 'Pause Rule' : 'Resume Rule'}
                    >
                      {rule.status === 'Active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 rounded-lg bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/30 text-[var(--alert-red)] hover:bg-[var(--alert-red)] hover:text-white transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3 font-mono text-xs">
                  <div className="flex items-start gap-4">
                    <span className="text-purple-400 font-bold uppercase tracking-widest w-16 shrink-0 mt-0.5">IF</span>
                    <span className="text-white bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">{rule.condition}</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-cyan-400 font-bold uppercase tracking-widest w-16 shrink-0 mt-0.5">THEN</span>
                    <span className="text-white bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">{rule.action}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 ${
                    rule.status === 'Active' ? 'text-[var(--verify-green)]' : 'text-[var(--signal-amber)]'
                  }`}>
                    {rule.status === 'Active' ? <span className="w-2 h-2 rounded-full bg-[var(--verify-green)] animate-pulse"/> : <span className="w-2 h-2 rounded-full bg-[var(--signal-amber)]"/>}
                    {rule.status}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                    Last execution: N/A
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
