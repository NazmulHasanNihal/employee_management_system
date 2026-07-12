import React, { useState, useRef } from 'react';
import { FileText, Download, Upload, Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export function DocumentVault({ documents, addToast }: { documents: any[], addToast: (msg: string, type: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const uploadMutation = trpc.profile.uploadDocument.useMutation({
    onSuccess: () => {
      utils.profile.getDocuments.invalidate();
      addToast('Document safely stored in R2 vault', 'success');
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addToast('Uploading...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        uploadMutation.mutate({ name: file.name, url: data.url });
      } else {
        addToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      addToast('Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ledger-panel p-6">
      <h3 className="font-mono text-xs font-bold text-[var(--ledger-blue)] uppercase tracking-widest mb-6 flex items-center gap-2">
        <FileText size={16} /> Document Vault (R2)
      </h3>
      <div className="space-y-2">
        {documents?.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-2 bg-[var(--bg-void)] border ledger-border">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={14} className={doc.color} />
              <span className="text-[10px] font-mono ledger-text truncate">{doc.name}</span>
            </div>
            {doc.url && (
              <a 
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="ledger-muted hover:text-[var(--text-main)] shrink-0"
              >
                <Download size={12}/>
              </a>
            )}
          </div>
        ))}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
        />
        <button 
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()} 
          className="w-full py-2 mt-2 border border-dashed ledger-border text-[var(--ledger-blue)] font-mono text-[9px] uppercase hover:bg-[var(--ledger-blue)]/10 transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? <Activity size={12} className="animate-spin" /> : <Upload size={12} />}
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
}
