import { headers } from 'next/headers';
import { currentUser } from './auth';

// Admin pages accept either of two credentials:
//   1. A signed-in user with role === 'admin' (the normal path)
//   2. The ADMIN_KEY shared secret via ?key=… or x-admin-key header
//      (break-glass for when sessions are broken or DB is being inspected
//      directly from a separate process)
//
// In dev, with no ADMIN_KEY set and no user, the gate is open. In prod,
// without either credential, the gate is locked.

export async function isAdmin(req?: Request): Promise<boolean> {
  const me = await currentUser().catch(() => null);
  if (me?.role === 'admin') return true;

  const expected = process.env.ADMIN_KEY;
  if (!expected) return process.env.NODE_ENV !== 'production';

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
