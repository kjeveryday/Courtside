// Token auth (R7, AD-6): random per-boot token, constant-time compare.
import { randomBytes, timingSafeEqual } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(16).toString('hex');
}

export function tokenEquals(expected: string, presented: string | undefined | null): boolean {
  if (!presented) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Bearer header wins; ?token= query is the WS/first-visit fallback.
export function extractToken(
  authorizationHeader: string | undefined,
  url: string,
): string | undefined {
  if (authorizationHeader?.startsWith('Bearer ')) return authorizationHeader.slice(7);
  const qIdx = url.indexOf('?');
  if (qIdx < 0) return undefined;
  return new URLSearchParams(url.slice(qIdx + 1)).get('token') ?? undefined;
}
