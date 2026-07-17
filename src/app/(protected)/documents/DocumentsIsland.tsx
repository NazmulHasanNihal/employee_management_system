'use client';

import React, { useState } from 'react';
import { Upload, Send, FileSignature, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DocumentsIsland() {
  return null;
}

// Admin-only "Distribute Document" toggle button placed in the header actions.
DocumentsIsland.CreateButton = function CreateButton() {
  const { isAdmin } = useUser();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      <Button variant="primary" onClick={() => setOpen((v) => !v)}>
        {open ? <X size={16} /> : <><Upload size={16} /> Distribute Document</>}
      </Button>
      {open && <DistributeForm />}
    </>
  );
};

// Sign button shown on each pending document.
DocumentsIsland.SignButton = function SignButton({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const signDocument = trpc.documents.signDocument.useMutation({
    onSuccess: () => utils.documents.getDocuments.invalidate(),
  });
  return (
    <Button
      variant="danger"
      className="w-full"
      disabled={signDocument.isPending}
      onClick={() => signDocument.mutate(id)}
    >
      <FingerprintIcon /> Cryptographically Sign
    </Button>
  );
};

function FingerprintIcon() {
  return <FileSignature size={14} />;
}

function DistributeForm() {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const utils = trpc.useUtils();
  const { data: users } = trpc.registry.searchEmployees.useQuery({ query: '' }, { enabled: true });
  const createDocument = trpc.documents.createDocument.useMutation({
    onSuccess: () => {
      utils.documents.getDocuments.invalidate();
      setName('');
      setUserId('');
      setRequiresSignature(false);
      setFile(null);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !userId || !file) {
      setError('Title, target employee, and a file are required.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Upload failed.');
        setUploading(false);
        return;
      }
      createDocument.mutate({
        title: name,
        url: json.url,
        type: requiresSignature ? 'SIGNATURE_REQUIRED' : 'General',
        ownerId: userId,
      });
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-6 shadow-2xl">
      <h3 className="mb-6 flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-sm font-semibold text-[var(--text-main)]">
        <FileTextIcon /> New Document Distribution
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Document Title</label>
            <Input type="text" required placeholder="e.g. Q4 NDA Agreement" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Assign Target Personnel</label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="ledger-input flex h-10 w-full rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="">Select Employee...</option>
              {(users || []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} - {u.designation}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-wide text-[var(--text-muted)]">File</label>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="ledger-input flex w-full rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4">
          <input
            type="checkbox"
            id="reqSig"
            checked={requiresSignature}
            onChange={(e) => setRequiresSignature(e.target.checked)}
            className="h-5 w-5 rounded border-[var(--border-hairline)] accent-[var(--brand)]"
          />
          <label htmlFor="reqSig" className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide text-[var(--text-main)]">
            Require Cryptographic E-Signature
          </label>
        </div>

        {error && <p className="text-xs text-[var(--rose)]">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={uploading || createDocument.isPending}>
          <Send size={18} /> Transmit File
        </Button>
      </form>
    </div>
  );
}

function FileTextIcon() {
  return <FileSignature size={16} className="text-[var(--brand-strong)]" />;
}
