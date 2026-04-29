import { NextResponse } from 'next/server';
import { z } from 'zod';
import { log } from '@/lib/debugger';
import { currentUser } from '@/lib/auth';
import { rateLimit, reapIfDue, clientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const schema = z.object({
  kind: z.string().min(1).max(40),
  path: z.string().max(500).optional(),
  dur: z.number().nonnegative().optional(),
  t: z.number().optional(),
});

// Client beacon for nav timings. Auth-gated and rate-limited so an
// anonymous attacker can't flood the debug ring buffer.
export async function POST(req: Request) {
  reapIfDue();
  const me = await currentUser().catch(() => null);
  if (!me) return NextResponse.json({ ok: false }, { status: 401 });

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && host && !origin.endsWith(host)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const gate = rateLimit(`debuglog:${me.id}:${clientIp(req)}`, 60, 60_000);
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  log('debug', `client/${parsed.data.kind}`, parsed.data.path ?? '', { t: parsed.data.t, uid: me.id }, parsed.data.dur);
  return NextResponse.json({ ok: true });
}
