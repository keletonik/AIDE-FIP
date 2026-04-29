import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { authenticate, SESSION_COOKIE, startSession } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { warn } from '@/lib/debugger';
import { rateLimit, reapIfDue, clientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const schema = z.object({
  identifier: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  reapIfDue();
  const ip = clientIp(req);

  const ipGate = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
  if (!ipGate.ok) {
    return NextResponse.json({ error: 'too many attempts, slow down' }, {
      status: 429,
      headers: { 'Retry-After': String(ipGate.resetSec) },
    });
  }

  const raw = await req.json().catch(() => ({}));
  const body = (raw && typeof raw === 'object' && raw !== null && 'identifier' in raw)
    ? raw
    : (raw && typeof raw === 'object' && raw !== null && 'email' in raw)
      ? { ...raw, identifier: (raw as { email: string }).email }
      : raw;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const idGate = rateLimit(`login:id:${parsed.data.identifier.toLowerCase()}`, 8, 15 * 60_000);
  if (!idGate.ok) {
    return NextResponse.json({ error: 'too many attempts for this account, try again later' }, {
      status: 429,
      headers: { 'Retry-After': String(idGate.resetSec) },
    });
  }

  const user = authenticate(parsed.data.identifier, parsed.data.password);
  if (!user) {
    warn('auth/login', 'failed', { ip });
    await audit({ action: 'auth.login.fail', target: hashId(parsed.data.identifier) });
    return NextResponse.json({ error: 'invalid username or password' }, { status: 401 });
  }

  const { token, expires } = startSession(user.id);
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  });
  await audit({ actor: user.email, action: 'auth.login.ok', target: String(user.id) });
  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}

function hashId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `id:${(h >>> 0).toString(16)}`;
}
