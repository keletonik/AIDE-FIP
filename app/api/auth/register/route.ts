import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createUser, SESSION_COOKIE, startSession, userCount, currentUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { rateLimit, reapIfDue, clientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email().max(200),
  username: z.string().regex(/^[A-Za-z0-9._-]{2,40}$/).optional(),
  password: z.string().min(12).max(200),
  name: z.string().min(1).max(120),
  role: z.enum(['admin', 'tech', 'viewer']).optional(),
});

// Two registration modes:
//   1. First user — anyone can register, becomes admin. Bootstrap path.
//   2. After that — only an authenticated admin can create accounts.
export async function POST(req: Request) {
  reapIfDue();
  const gate = rateLimit(`register:${clientIp(req)}`, 5, 15 * 60_000);
  if (!gate.ok) {
    return NextResponse.json({ error: 'too many attempts' }, {
      status: 429, headers: { 'Retry-After': String(gate.resetSec) },
    });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
  }

  const total = userCount();
  let role: 'admin' | 'tech' | 'viewer' = 'tech';

  if (total === 0) {
    role = 'admin';
  } else {
    const me = await currentUser();
    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'registration disabled — ask an admin' }, { status: 403 });
    }
    role = parsed.data.role ?? 'tech';
  }

  let user;
  try {
    user = createUser({
      email: parsed.data.email,
      username: parsed.data.username ?? null,
      password: parsed.data.password,
      name: parsed.data.name,
      role,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 400 });
  }

  await audit({ actor: user.email, action: 'auth.register', target: String(user.id), payload: { role: user.role } });

  // Bootstrap admin gets an immediate session; admin-created accounts do not.
  if (total === 0) {
    const { token, expires } = startSession(user.id);
    const c = await cookies();
    c.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
    });
  }

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}
