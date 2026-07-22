import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback handler for Supabase OAuth, magic-link, and email-invitation
 * flows (P0: "Add auth/callback route + a verify-email step so OAuth/magic-link
 * works").
 *
 * Supabase redirects here with either:
 *   - `?code=...`            (PKCE OAuth / magic-link via code exchange), or
 *   - `?token_hash=...&type=...` (email OTP / invitation link).
 *
 * We exchange the credential for a session (cookies are set by the server
 * client) and then route the user to `next` (default `/`), where the
 * onboarding / verify-email gate decides what they see.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  } else if (tokenHash && type) {
    const validTypes = ['magiclink', 'recovery', 'invite', 'email_change', 'signup', 'password'] as const;
    const otpType = validTypes.includes(type as typeof validTypes[number]) ? type : 'magiclink';
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType as 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'signup' | 'password' });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=Missing auth parameters`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
