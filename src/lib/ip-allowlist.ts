/**
 * IP allowlist utility (P2 — security).
 *
 * Optional IP-based access control for admin routes. When ADMIN_IP_ALLOWLIST
 * is set (comma-separated CIDR ranges or single IPs), only requests from
 * those IPs can access admin-protected routes.
 *
 * Environment variables:
 *   ADMIN_IP_ALLOWLIST - Comma-separated list of allowed IPs/CIDRs (e.g. "192.168.1.0/24,10.0.0.1")
 *   ADMIN_IP_DENY_MESSAGE - Custom message for denied requests (optional)
 *
 * If ADMIN_IP_ALLOWLIST is not set, all IPs are allowed (backward compatible).
 */

import ipaddr from 'ipaddr.js';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWLIST = process.env.ADMIN_IP_ALLOWLIST || '';
const DENY_MESSAGE = process.env.ADMIN_IP_DENY_MESSAGE || 'Access denied: IP not in admin allowlist';

type IpRange = [ipaddr.IPv4 | ipaddr.IPv6, number];

let parsedAllowlist: IpRange[] | null = null;

function parseAllowlist(): IpRange[] | null {
  if (!ALLOWLIST) return null;
  if (parsedAllowlist) return parsedAllowlist;

  const entries = ALLOWLIST.split(',').map((s) => s.trim()).filter(Boolean);
  const ranges: IpRange[] = [];

  for (const entry of entries) {
    if (entry.includes('/')) {
      const [network, prefixLen] = entry.split('/');
      const parsed = ipaddr.parse(network);
      ranges.push([parsed, parseInt(prefixLen, 10)]);
    } else {
      const parsed = ipaddr.parse(entry);
      ranges.push([parsed, 32]);
    }
  }

  parsedAllowlist = ranges;
  return ranges;
}

export function isIpAllowed(clientIp: string | null): boolean {
  if (!clientIp) return true;
  const allowlist = parseAllowlist();
  if (!allowlist) return true;

  try {
    const ip = ipaddr.parse(clientIp);
    return allowlist.some(([range, prefixLen]) => ip.match(range, prefixLen));
  } catch {
    return false;
  }
}

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return (request as any).ip || null;
}

export function isAdminRoute(pathname: string): boolean {
  const adminPrefixes = [
    '/settings',
    '/registry',
    '/payroll',
    '/payroll-settings',
    '/expenses',
    '/penalties',
    '/attendance',
    '/leave',
    '/recruitment',
    '/performance',
    '/compliance',
    '/automations',
    '/dei',
    '/audit',
    '/hierarchy',
    '/shifts',
    '/applications',
    '/helpdesk',
    '/documents',
    '/calendar',
    '/engagement',
    '/feedback',
    '/recognition',
    '/training',
    '/whistleblower',
    '/reviews',
    '/policy',
    '/benefits',
    '/festival-bonus',
    '/payment-hub',
    '/grid',
    '/team',
    '/notifications',
    '/profile',
    '/onboarding',
  ];
  return adminPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function createIpDenyResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: 'IP_NOT_ALLOWED', message: DENY_MESSAGE }),
    { status: 403, headers: { 'content-type': 'application/json' } }
  );
}
