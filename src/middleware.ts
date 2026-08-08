import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isIpAllowed, getClientIp, isAdminRoute, createIpDenyResponse } from '@/lib/ip-allowlist'

// ── Rate Limiting (In-Memory per Isolate) ──────────────────────────────────
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function applyRateLimit(ip: string): boolean {
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;    // 100 requests per minute per IP
  const now = Date.now();

  const record = rateLimitMap.get(ip);
  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function middleware(request: NextRequest) {
  try {
    const clientIp = getClientIp(request) || 'unknown';
    
    // Phase 1: API Rate Limiting (DDoS Protection)
    if (!applyRateLimit(clientIp)) {
      return new NextResponse(
        JSON.stringify({ error: "TOO_MANY_REQUESTS", message: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "content-type": "application/json", "Retry-After": "60" } }
      );
    }

    // CORS & Origin Protection: Reject cross-origin mutations to /api/
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && request.nextUrl.pathname.startsWith('/api/')) {
      const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
      if (isMutation) {
        const allowedHost = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : host;
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host && originHost !== allowedHost) {
            return new NextResponse(
              JSON.stringify({ error: 'FORBIDDEN_ORIGIN', message: 'Cross-origin requests are forbidden.' }),
              { status: 403, headers: { 'content-type': 'application/json' } }
            );
          }
        } catch {
          // Invalid origin header
        }
      }
    }

    const code = request.nextUrl.searchParams.get('code');
    const tokenHash = request.nextUrl.searchParams.get('token_hash');
    const type = request.nextUrl.searchParams.get('type');
    
    // Intercept Supabase Auth redirects (magic links / invites) gracefully.
    // If the request contains auth parameters but isn't already going to the callback,
    // forward it to the callback route so the session is securely exchanged.
    if ((code || (tokenHash && type)) && !request.nextUrl.pathname.startsWith('/auth/callback')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/callback';
      if (!url.searchParams.has('next')) {
        url.searchParams.set('next', request.nextUrl.pathname === '/' ? '/' : request.nextUrl.pathname);
      }
      return NextResponse.redirect(url);
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If variables are missing, redirect to the setup page instead of crashing
    if (!supabaseUrl || !supabaseKey) {
      if (!request.nextUrl.pathname.startsWith('/setup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/setup'
        return NextResponse.redirect(url)
      }
      return supabaseResponse;
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              // Phase 3: Session Hijacking Prevention
              // Enforce strict security on all session cookies
              const secureOptions = {
                ...options,
                sameSite: 'strict' as const,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
              };
              supabaseResponse.cookies.set(name, value, secureOptions);
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Allow server-to-server cron / webhook routes that authenticate via a
    // shared secret (CRON_SECRET) instead of a Supabase session. These routes
    // enforce their own authorization internally.
    if (request.nextUrl.pathname.startsWith('/api/cron')) {
      return supabaseResponse;
    }

    // ── IP allowlist for admin routes ───────────────────────────────────────
    // When ADMIN_IP_ALLOWLIST is set, only requests from allowed IPs/CIDRs
    // can access admin-protected routes. Non-admin routes are unaffected.
    // This is an extra layer of protection for privileged operations.
    if (user && isAdminRoute(request.nextUrl.pathname)) {
      const clientIp = getClientIp(request);
      if (!isIpAllowed(clientIp)) {
        return createIpDenyResponse();
      }
    }

    // ── CSRF / cross-origin protection for state-changing requests ──────────
    // Server Actions and mutation API routes are same-origin by design. We
    // reject any mutating request whose Origin/Referer is not this host.
    // GET/HEAD and the public invite API (which validates its own secret) are
    // exempt. This is defense-in-depth on top of SameSite cookies.
    const isMutation =
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      (request.method === "POST" || request.method === "PUT" || request.method === "DELETE" || request.method === "PATCH" || request.headers.has("Next-Action"));
    const isPublicApi =
      request.nextUrl.pathname.startsWith("/api/invite") ||
      request.nextUrl.pathname.startsWith("/api/cron");
    if (isMutation && !isPublicApi) {
      const host = request.nextUrl.host;
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");
      const refererHost = referer ? (() => { try { return new URL(referer).host; } catch { return null; } })() : null;
      // Allowed when a same-origin Origin/Referer is present, or when neither
      // header is sent at all (some same-origin form posts omit Origin) — in
      // that case SameSite cookies remain the baseline defense. We only block
      // when a cross-origin Origin/Referer is explicitly present.
      const crossOrigin =
        (origin && new URL(origin).host !== host) || (referer && refererHost !== host);
      if (crossOrigin) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF_ORIGIN_MISMATCH" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }

    const isPublicRoute = 
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/pricing') ||
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/setup') ||
      request.nextUrl.pathname.startsWith('/auth/callback') ||
      request.nextUrl.pathname.startsWith('/api/invite') ||
      request.nextUrl.pathname.startsWith('/invite') ||
      request.nextUrl.pathname.startsWith('/verify-email') ||
      request.nextUrl.pathname.startsWith('/update-password');

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (
      user &&
      request.nextUrl.pathname.startsWith('/login')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    return new NextResponse(
      JSON.stringify({ 
        error: "MIDDLEWARE_CRASH", 
        message,
        stack
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json / sw.js (PWA assets — must be publicly fetchable)
     * - static asset extensions (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
