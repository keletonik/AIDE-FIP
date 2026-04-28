import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { authenticate, SESSION_COOKIE, startSession } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { warn } from '@/lib/debugger';

export const runtime = 'nodejs';

// Login accepts either a username or an email — auth picks the right
// lookup based on whether the value contains an "@". Older clients that
// still post `email` keep working: we coerce to the new field name.
const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const body = (raw && typeof raw === 'object' && raw !== null && 'identifier' in raw)
    ? raw
    : (raw && typeof raw === 'object' && raw !== null && 'email' in raw)
      ? { ...raw, identifier: (raw as { email: string }).email }
      : raw;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const user = authenticate(parsed.data.identifier, parsed.data.password);
  if (!user) {
    warn('auth/login', 'failed', { identifier: parsed.data.identifier });
    await audit({ action: 'auth.login.fail', target: parsed.data.identifier });
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
