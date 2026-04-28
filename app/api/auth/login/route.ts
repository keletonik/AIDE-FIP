import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { authenticate, SESSION_COOKIE, startSession } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { warn } from '@/lib/debugger';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const user = authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    warn('auth/login', 'failed', { email: parsed.data.email });
    await audit({ action: 'auth.login.fail', target: parsed.data.email });
    return NextResponse.json({ error: 'invalid email or password' }, { status: 401 });
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
