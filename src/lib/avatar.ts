/**
 * Avatar URL helpers.
 *
 * Avatars are stored in a PUBLIC Supabase Storage bucket (`ems-uploads`). The
 * permanent, never-expiring form is:
 *   …/storage/v1/object/public/<bucket>/<path>
 *
 * Historically some rows hold a SHORT-LIVED signed URL
 * (…/storage/v1/object/sign/<bucket>/<path>?token=…&exp=…) which expires after
 * an hour and then 403s — that is why avatars "break" and stop showing. And
 * some rows may hold just the storage path. This helper normalizes any of those
 * shapes into the permanent public URL so an avatar always renders.
 */

const SUPABASE_HOST_RE = /supabase\.co\/storage\/v1\/object\/(?:sign|public)\/([^/?]+)\/(.+?)(?:\?.*)?$/;
const SUPABASE_PATH_RE = /^ems-uploads\/(.+)$/;

export function toPublicAvatarUrl(input?: string | null): string | null {
  if (!input) return null;

  // Already a public URL — return as-is.
  if (input.includes('/object/public/')) {
    return input;
  }

  // Signed URL: …/object/sign/<bucket>/<path>?token=…  → strip the query and
  // rewrite "sign" → "public".
  const signed = input.match(SUPABASE_HOST_RE);
  if (signed) {
    const bucket = signed[1];
    const path = signed[2];
    const base = input.split('/storage/v1/object/')[0];
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  // Bare storage path like "ems-uploads/avatars/uid/file.png".
  const pathMatch = input.match(SUPABASE_PATH_RE);
  if (pathMatch) {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    if (base) return `${base}/storage/v1/object/public/${pathMatch[1]}`;
  }

  // Not a Supabase storage URL (e.g. an external/avatar provider URL) — pass
  // through untouched so it still loads.
  return input;
}
