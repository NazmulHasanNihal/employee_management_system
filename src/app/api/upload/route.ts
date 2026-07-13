import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getPostHogClient } from '@/lib/posthog-server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads directory so it can be served statically
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const uniqueName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, uniqueName);

    // In a real app, ensure the directory exists first.
    // For local dev, we will just try to write it.
    await writeFile(filePath, buffer);

    const distinctId = req.headers.get('x-posthog-distinct-id') || 'anonymous';
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId,
      event: 'file_uploaded',
      properties: {
        file_type: file.type,
        file_size_bytes: file.size,
      },
    });
    await posthog.flush();

    return NextResponse.json({ success: true, url: `/uploads/${uniqueName}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
