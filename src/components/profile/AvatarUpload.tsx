'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, Loader2, Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/components/UserProvider';
import { updateAvatarUrl, recordPhotoHistory } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export function AvatarUpload({
  currentUrl,
  size = 'xl',
  targetUserId,
  targetName,
  onUploadSuccess,
}: {
  currentUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  targetUserId?: string;
  targetName?: string;
  onUploadSuccess?: (url: string) => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Load image for cropping
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setIsCropping(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsCropping(false);
      setUploading(true);
      setSaved(false);

      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');

      const localPreview = URL.createObjectURL(croppedBlob);
      setPreview(localPreview);

      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');
      formData.append('folder', 'avatars');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        await updateAvatarUrl(data.url, targetUserId);
        try { await recordPhotoHistory(data.url, targetUserId); } catch { /* non-fatal */ }
        
        setPreview(data.url);
        setSaved(true);
        if (onUploadSuccess) onUploadSuccess(data.url);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        setPreview(currentUrl ?? null);
        console.error('Upload failed', data.error);
      }
    } catch (err) {
      setPreview(currentUrl ?? null);
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      setImageSrc(null);
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setImageSrc(null);
  };

  return (
    <>
      <div className="relative inline-flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 focus:ring-offset-[var(--bg-panel)]"
          aria-label="Change avatar"
        >
          <Avatar src={preview} name={targetName || user.name} size={size} />
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

      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative flex h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-[var(--bg-panel)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] p-4">
              <h3 className="font-semibold text-[var(--text-main)]">Adjust Profile Picture</h3>
              <button onClick={cancelCrop} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative flex-1 bg-black/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="flex flex-col gap-4 border-t border-[var(--border-hairline)] p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[var(--text-muted)]">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-2 w-full appearance-none rounded-full bg-[var(--border-hairline)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--brand)]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelCrop}
                  className="rounded-xl border border-[var(--border-hairline)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadCrop}
                  className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)]"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
