import React from 'react';
import { ShieldCheck, FileText, Fingerprint, CheckCircle, File, Clock, Download, HardDrive } from 'lucide-react';
import { q } from '@/server/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { CreateButton, SignButton } from './DocumentsIsland';

export const dynamic = 'force-dynamic';

function formatSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const documents = await q.documents();

  const pendingDocs = (documents || []).filter((d: { status: string }) => d.status === 'PENDING');
  const completedDocs = (documents || []).filter((d: { status: string }) => d.status !== 'PENDING');

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      <PageHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Document Vault"
        subtitle="Secure document storage, distribution and signatures."
        actions={
          <div className="flex flex-wrap gap-2">
            <CreateButton />
          </div>
        }
      />

      {pendingDocs.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--rose)]">
            <Fingerprint size={16} /> Action Required (Awaiting Signature)
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingDocs.map((doc: { id: string; title: string; createdAt: Date }) => (
              <div key={doc.id} className="relative overflow-hidden rounded-2xl border border-[var(--rose)]/40 bg-[var(--bg-panel)] p-6 transition-colors">
                <div className="mb-4 flex justify-between items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] text-[var(--rose)]">
                    <FileText size={24} />
                  </div>
                  <Badge variant="rose">Pending</Badge>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-[var(--text-main)]">{doc.title}</h4>
                <p className="mb-6 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  <Clock size={12} /> Received {new Date(doc.createdAt).toLocaleDateString()}
                </p>
                <SignButton id={doc.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-4 text-sm font-semibold text-[var(--text-main)]">
          <FileText size={16} className="text-[var(--brand-strong)]" /> Vault Archive
        </h3>

        {completedDocs.length === 0 ? (
          <EmptyState
            title="No documents in archive"
            description="Uploaded and signed documents will appear here."
            icon={<FileText className="h-5 w-5" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedDocs.map((doc: { id: string; title: string; signed: boolean; type: string; category: string; size?: number; createdAt: Date; url: string }) => (
              <div key={doc.id} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 transition-colors hover:border-[var(--brand)]/30">
                <div className="mb-4 flex justify-between items-start">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${doc.signed ? 'bg-[var(--emerald-soft)] text-[var(--emerald)] border-[var(--emerald)]/30' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-hairline)]'}`}>
                    {doc.signed ? <CheckCircle size={20} /> : <File size={20} />}
                  </div>
                  <Badge variant={doc.signed ? 'emerald' : 'secondary'}>{doc.signed ? 'Signed' : 'Stored'}</Badge>
                </div>
                <h4 className="mb-1 truncate text-base font-semibold text-[var(--text-main)]" title={doc.title}>{doc.title}</h4>
                <p className="mb-1 text-[11px] text-[var(--text-muted)]">{doc.category || doc.type}</p>
                {doc.size ? (
                  <p className="mb-4 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    <HardDrive size={12} /> {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mb-4 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(doc.url, '_blank')}
                >
                  <Download size={14} /> Open Document
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
