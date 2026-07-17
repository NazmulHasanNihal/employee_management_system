'use client';

import React, { useState, useRef } from 'react';
import { FileText, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadDocument } from '@/app/actions/profile';

interface DocRow {
  id: string;
  title: string;
  url?: string | null;
  type?: string | null;
  createdAt?: string | Date | null;
}

export function DocumentVault({ documents }: { documents: DocRow[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const [localDocs, setLocalDocs] = useState<DocRow[]>(documents);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // keep in sync if parent re-renders
  React.useEffect(() => setLocalDocs(documents), [documents]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        const created = await uploadDocument(file.name, data.url, 'General');
        if (created && (created as DocRow).id) {
          setLocalDocs((prev) => [created as DocRow, ...prev]);
        } else {
          setLocalDocs((prev) => [{ id: `${Date.now()}`, title: file.name, url: data.url }, ...prev]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {localDocs.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No documents stored yet.</p>
      ) : (
        <ul className="space-y-2">
          {localDocs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={15} className="shrink-0 text-[var(--brand-strong)]" />
                <span className="truncate text-sm font-medium text-[var(--text-main)]">{doc.title}</span>
              </div>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]"
                  aria-label="Download"
                >
                  <Download size={15} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full">
        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {isUploading ? 'Uploading…' : 'Upload Document'}
      </Button>
    </div>
  );
}
