'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { updateProfileField } from '@/app/actions/profile';

export function EditableName({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(name), [name]);

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await updateProfileField('name', draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center justify-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-56 rounded-xl px-2 py-1 text-center text-xl font-semibold outline-none"
          autoFocus
        />
        <button type="button" onClick={save} disabled={saving} className="text-[var(--emerald)]" aria-label="Save name">
          <Check size={16} />
        </button>
        <button type="button" onClick={() => { setDraft(name); setEditing(false); }} className="text-[var(--text-muted)]" aria-label="Cancel">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-2 text-xl font-semibold text-[var(--text-main)]"
      aria-label="Edit name"
    >
      {name}
      <Pencil size={14} className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
