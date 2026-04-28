import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { endSession, SESSION_COOKIE } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) endSession(token);
  c.delete(SESSION_COOKIE);
  await audit({ action: 'auth.logout' });
  return NextResponse.json({ ok: true });
}
