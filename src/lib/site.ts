/**
 * Resolve the public site origin. Used to build absolute invite/verify links
 * that survive being emailed (relative URLs break in mail clients). Kept out of
 * `actions/admin.ts` because that module is `'use server'` and all its exports
 * must be async functions.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
