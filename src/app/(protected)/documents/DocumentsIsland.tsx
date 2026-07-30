'use client';

import React, { useState } from 'react';
import { Upload, Send, FileSignature, X, Shield, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';

export function CreateButton() {
  const { user, isAdmin } = useUser();
  const [openAdminDistribute, setOpenAdminDistribute] = useState(false);
  const [openUserUpload, setOpenUserUpload] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => { setOpenUserUpload((v) => !v); setOpenAdminDistribute(false); }}>
        {openUserUpload ? <X size={16} /> : <><Upload size={16} /> Upload My Document</>}
      </Button>

      {isAdmin && (
        <Button variant="primary" size="sm" onClick={() => { setOpenAdminDistribute((v) => !v); setOpenUserUpload(false); }}>
          {openAdminDistribute ? <X size={16} /> : <><Send size={16} /> Distribute to Employee</>}
        </Button>
      )}

      {openUserUpload && <UserUploadForm onClose={() => setOpenUserUpload(false)} />}
      {openAdminDistribute && <DistributeForm onClose={() => setOpenAdminDistribute(false)} />}
    </div>
  );
}

export function SignButton({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const signDocument = trpc.documents.signDocument.useMutation({
    onSuccess: () => {
      toast.success('Document Signed', 'Cryptographic signature recorded successfully.');
      utils.documents.getDocuments.invalidate();
    },
  });
  return (
    <Button
      variant="danger"
      className="w-full"
      disabled={signDocument.isPending}
      onClick={() => signDocument.mutate({ id })}
    >
      <FileSignature size={14} className="mr-1.5" /> Cryptographically Sign
    </Button>
  );
}

function UserUploadForm({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('NID / Passport');
  const [privacy, setPrivacy] = useState<'PRIVATE' | 'HR_ONLY' | 'PUBLIC'>('PRIVATE');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const utils = trpc.useUtils();
  const createDocument = trpc.documents.createDocument.useMutation({
    onSuccess: () => {
      toast.success('Uploaded', 'Document saved to your personal vault.');
      utils.documents.getDocuments.invalidate();
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) {
      setError('Please provide document title and select a file.');
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
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        category: category,
        type: privacy,
        status: 'ACTIVE',
        ownerId: user.id,
      });
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full mt-4 rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-6 shadow-2xl animate-fade-up">
      <h3 className="mb-4 flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 text-sm font-semibold text-[var(--text-main)]">
        <span className="flex items-center gap-2"><Upload size={16} className="text-[var(--brand)]" /> Upload Personal Document</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">Document Title</label>
            <Input type="text" required placeholder="e.g. Passport / NID Copy" value={name} onChange={(e) => setName(e.target.value)} className="ledger-input rounded-xl" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">Document Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2 text-sm">
              <option value="NID / Passport">NID / Passport Identity</option>
              <option value="Employment Contract">Employment Contract</option>
              <option value="Tax Certificate">Tax TIN Certificate</option>
              <option value="Academic Degree">Academic Degree / Transcript</option>
              <option value="Experience Letter">Experience Letter</option>
              <option value="Medical Certificate">Medical Certificate</option>
              <option value="Other">Other Personal Record</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">Privacy & Sharing Level</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPrivacy('PRIVATE')}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${privacy === 'PRIVATE' ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}
            >
              <Lock size={14} /> Private to Me
            </button>
            <button
              type="button"
              onClick={() => setPrivacy('HR_ONLY')}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${privacy === 'HR_ONLY' ? 'border-[var(--emerald)] bg-[var(--emerald-soft)] text-[var(--emerald)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}
            >
              <Shield size={14} /> Share with HR
            </button>
            <button
              type="button"
              onClick={() => setPrivacy('PUBLIC')}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${privacy === 'PUBLIC' ? 'border-[var(--sky)] bg-[var(--sky-soft)] text-[var(--sky)]' : 'border-[var(--border-hairline)] text-[var(--text-muted)]'}`}
            >
              <Eye size={14} /> Public Team
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">File Attachment</label>
          <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="ledger-input w-full rounded-xl px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-xs text-[var(--rose)]">{error}</p>}

        <Button type="submit" variant="primary" className="w-full rounded-xl" disabled={uploading || createDocument.isPending}>
          <Upload size={16} className="mr-1.5" /> Save Document to Vault
        </Button>
      </form>
    </div>
  );
}

function DistributeForm({ onClose }: { onClose: () => void }) {
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
      toast.success('Distributed', 'Document sent to employee vault.');
      utils.documents.getDocuments.invalidate();
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userId || !file) {
      setError('Title, target employee, and file required.');
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
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        category: 'Official Distribution',
        type: requiresSignature ? 'SIGNATURE_REQUIRED' : 'HR_ONLY',
        status: requiresSignature ? 'PENDING' : 'ACTIVE',
        ownerId: userId,
      });
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full mt-4 rounded-3xl border border-[var(--emerald)]/30 bg-[var(--bg-panel)] p-6 shadow-2xl animate-fade-up">
      <h3 className="mb-4 flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 text-sm font-semibold text-[var(--text-main)]">
        <span className="flex items-center gap-2"><Send size={16} className="text-[var(--emerald)]" /> Admin Document Distribution</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">Document Title</label>
            <Input type="text" required placeholder="e.g. Q4 Performance Policy / NDA" value={name} onChange={(e) => setName(e.target.value)} className="ledger-input rounded-xl" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">Assign Target Employee</label>
            <select required value={userId} onChange={(e) => setUserId(e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2 text-sm">
              <option value="">Select Employee...</option>
              {(users || []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--text-muted)]">File</label>
          <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="ledger-input w-full rounded-xl px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3">
          <input type="checkbox" id="reqSig" checked={requiresSignature} onChange={(e) => setRequiresSignature(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
          <label htmlFor="reqSig" className="cursor-pointer select-none text-xs font-semibold text-[var(--text-main)]">
            Require Cryptographic E-Signature
          </label>
        </div>

        {error && <p className="text-xs text-[var(--rose)]">{error}</p>}

        <Button type="submit" variant="primary" className="w-full rounded-xl" disabled={uploading || createDocument.isPending}>
          <Send size={16} className="mr-1.5" /> Transmit Document to Employee
        </Button>
      </form>
    </div>
  );
}
