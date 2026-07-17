import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Allowlist of accepted extensions and their expected "magic bytes" (file
// signatures). We validate BOTH extension and the first bytes of the file so a
// renamed executable (e.g. evil.exe -> evil.png) is rejected.
const ALLOWED_EXT = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'txt']);

const MAGIC_BYTES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  png: [[0x89, 0x50, 0x4e, 0x47]], // ‰PNG
  jpg: [[0xff, 0xd8, 0xff]], // ÿØÿ
  jpeg: [[0xff, 0xd8, 0xff]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF
  doc: [[0xd0, 0xcf, 0x11, 0xe0]], // OLE compound file
  docx: [[0x50, 0x4b, 0x03, 0x04]], // ZIP (OOXML)
  xls: [[0xd0, 0xcf, 0x11, 0xe0]],
  xlsx: [[0x50, 0x4b, 0x03, 0x04]],
  txt: [], // text — any bytes acceptable
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = 'ems-uploads';

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, '').replace(/[\0-\x1f<>:"|?*]/g, '_');
  return base.slice(0, 100) || 'upload.bin';
}

function matchesMagic(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures || signatures.length === 0) return true;
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

export async function POST(req: NextRequest) {
  try {
    // Require an authenticated user.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folder = (data.get('folder') as string) || 'documents'; // 'avatars' | 'documents'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 413 });
    }

    const originalName = file.name || 'upload.bin';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ success: false, error: `File type ".${ext}" not allowed` }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate the file's actual content (magic bytes), not just the extension.
    const header = buffer.subarray(0, 8);
    if (!matchesMagic(header, ext)) {
      return NextResponse.json({ success: false, error: 'File content does not match its extension' }, { status: 415 });
    }

    // Upload to Supabase Storage. Avatars are publicly readable; documents are
    // private (access-controlled by RLS + app logic). Uses the service-role
    // admin client so the upload succeeds regardless of the user's RLS role,
    // while we still enforce ownership at the app layer above.
    const admin = createAdminClient();
    const safeName = sanitizeFilename(originalName);
    const key = folder === 'avatars'
      ? `avatars/${user.id}/${Date.now()}-${safeName}`
      : `documents/${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: file.type || 'application/octet-stream', upsert: true });

    if (uploadError) {
      logError('Supabase upload error:', uploadError);
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }

    // Avatars are stored with a public-read policy; documents are private and
    // should be accessed via a signed URL (handled by the caller if needed).
    const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(key);

    return NextResponse.json({ success: true, url: publicUrl.publicUrl });
  } catch (error) {
    logError('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
