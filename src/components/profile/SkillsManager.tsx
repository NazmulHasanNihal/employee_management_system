'use client';

import React, { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addSkill, removeSkill } from '@/app/actions/profile';

interface SkillRow {
  id: string;
  skill: string;
  level: number;
}

export function SkillsManager({ initialSkills }: { initialSkills: SkillRow[] }) {
  const [skills, setSkills] = useState<SkillRow[]>(initialSkills);
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState(3);
  const [pending, setPending] = useState(false);

  const handleAdd = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      const created = await addSkill(trimmed, newLevel);
      if (created && (created as SkillRow).id) {
        const row = created as SkillRow;
        setSkills((prev) => {
          // `addSkill` updates the existing row when the skill already exists,
          // so replace any prior entry with the same id/skill instead of
          // appending a duplicate.
          const exists = prev.some((s) => s.id === row.id || s.skill === row.skill);
          if (exists) return prev.map((s) => (s.id === row.id || s.skill === row.skill ? row : s));
          return [...prev, row];
        });
      } else {
        // refresh defensively
        setSkills((prev) => [...prev, { id: `${Date.now()}`, skill: trimmed, level: newLevel }]);
      }
      setNewSkill('');
      setNewLevel(3);
    } finally {
      setPending(false);
    }
  };

  const handleRemove = async (skill: string) => {
    setSkills((prev) => prev.filter((s) => s.skill !== skill));
    await removeSkill(skill);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No skills added yet.</p>
        ) : (
          skills.map((s) => (
            <span
              key={s.id}
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-3 py-1.5 text-sm text-[var(--text-main)]"
            >
              <span className="font-medium">{s.skill}</span>
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={11}
                    className={i < s.level ? 'fill-[var(--amber)] text-[var(--amber)]' : 'text-[var(--text-muted)]/40'}
                  />
                ))}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(s.skill)}
                className="ml-1 text-[var(--text-muted)] transition-colors hover:text-[var(--rose)]"
                aria-label={`Remove ${s.skill}`}
              >
                <X size={13} />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a skill (e.g. TypeScript)"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <select
          value={newLevel}
          onChange={(e) => setNewLevel(Number(e.target.value))}
          className="ledger-input h-10 w-20 rounded-xl px-2 text-sm outline-none"
          aria-label="Skill level"
        >
          {[1, 2, 3, 4, 5].map((l) => (
            <option key={l} value={l}>
              L{l}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={handleAdd} disabled={pending || !newSkill.trim()}>
          <Plus size={14} /> Add
        </Button>
      </div>
    </div>
  );
}
