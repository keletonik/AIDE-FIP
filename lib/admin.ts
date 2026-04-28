import { headers } from 'next/headers';

// Tiny shared-secret gate for the audit / debug dashboards. Anyone with
// the ADMIN_KEY can read; in practice the deployment puts this behind
// Replit's auth proxy or Cloudflare Access too.
//
// Two ways to authenticate:
//   - ?key=<value> on the URL (handy for direct GETs)
//   - x-admin-key request header (used by client-side fetches)

export async function isAdmin(req?: Request): Promise<boolean> {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return process.env.NODE_ENV !== 'production'; // dev: open
  if (req) {
    const header = req.headers.get('x-admin-key');
    if (header && safeEq(header, expected)) return true;
    const url = new URL(req.url);
    const q = url.searchParams.get('key');
    if (q && safeEq(q, expected)) return true;
  }
  try {
    const h = await headers();
    const header = h.get('x-admin-key');
    if (header && safeEq(header, expected)) return true;
  } catch { /* not in a request context */ }
  return false;
}

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
