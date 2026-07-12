"use client";

import React, { useState } from 'react';
import { Target, Plus, Trash2, Star } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export function SkillsWallet({ user, addToast }: { user: any, addToast: (msg: string, type?: string) => void }) {
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState(1);
  
  const utils = trpc.useUtils();
  const { data: skills, isLoading } = trpc.profile.getSkills.useQuery({ userId: user.id });

  const addSkill = trpc.profile.addSkill.useMutation({
    onSuccess: () => {
      addToast('Skill added to wallet', 'success');
      utils.profile.getSkills.invalidate();
      setNewSkill('');
      setNewLevel(1);
    }
  });

  const removeSkill = trpc.profile.removeSkill.useMutation({
    onSuccess: () => {
      addToast('Skill removed', 'success');
      utils.profile.getSkills.invalidate();
    }
  });

  return (
    <div className="ledger-panel p-6">
      <h3 className="font-mono text-xs font-bold text-[var(--signal-amber)] uppercase tracking-widest mb-6 flex items-center gap-2">
        <Target size={16} /> Skills Wallet
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            className="flex-1 bg-[var(--bg-void)] border ledger-border p-2 text-xs font-mono text-[var(--text-main)] focus:border-[var(--signal-amber)] outline-none"
            placeholder="e.g. React, Node.js"
            disabled={addSkill.isPending}
          />
          <select 
            value={newLevel}
            onChange={e => setNewLevel(Number(e.target.value))}
            className="w-16 bg-[var(--bg-void)] border ledger-border p-2 text-xs font-mono text-[var(--text-main)] outline-none"
          >
            {[1,2,3,4,5].map(lvl => <option key={lvl} value={lvl}>L{lvl}</option>)}
          </select>
          <button 
            onClick={() => {
              if (!newSkill) return;
              addSkill.mutate({ skill: newSkill, level: newLevel });
            }}
            disabled={addSkill.isPending}
            className="bg-[var(--signal-amber)]/20 hover:bg-[var(--signal-amber)]/30 text-[var(--signal-amber)] border border-[var(--signal-amber)]/50 p-2 transition-colors flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-[10px] font-mono ledger-muted animate-pulse">Loading skills...</div>
        ) : (
          <ul className="space-y-2">
            {skills?.length === 0 ? (
              <li className="text-[10px] font-mono ledger-muted">No skills in wallet.</li>
            ) : (
              skills?.map(s => (
                <li key={s.id} className="flex justify-between items-center border border-[var(--bg-void)] bg-[var(--bg-void)]/50 p-2">
                  <span className="font-mono text-xs text-[var(--text-main)] uppercase">{s.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} className={i < s.level ? "text-[var(--signal-amber)] fill-[var(--signal-amber)]" : "text-gray-700"} />
                      ))}
                    </div>
                    <button 
                      onClick={() => removeSkill.mutate({ skill: s.skill })}
                      className="text-gray-500 hover:text-[var(--alert-red)] transition-colors ml-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
