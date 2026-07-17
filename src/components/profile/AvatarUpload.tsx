'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/components/UserProvider';
import { updateAvatarUrl, recordPhotoHistory } from '@/app/actions/profile';

export function AvatarUpload({
  currentUrl,
  size = 'xl',
}: {
  currentUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const { user } = useUser();
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSaved(false);

    // Local preview immediately.
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        await updateAvatarUrl(data.url);
        // Keep a timeline of past profile pictures.
        try { await recordPhotoHistory(data.url); } catch { /* non-fatal */ }
        setPreview(data.url);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        // revert preview on failure
        setPreview(currentUrl ?? null);
        console.error('Upload failed', data.error);
      }
    } catch (err) {
      setPreview(currentUrl ?? null);
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 focus:ring-offset-[var(--bg-panel)]"
        aria-label="Change avatar"
      >
        <Avatar src={preview} name={user.name} size={size} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? <Loader2 size={22} className="animate-spin" /> : saved ? <Check size={22} /> : <Camera size={22} />}
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <span className="text-xs font-medium text-[var(--text-muted)]">
        {uploading ? 'Uploading…' : saved ? 'Saved' : 'Change photo'}
      </span>
    </div>
  );
}
