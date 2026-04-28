import { NextResponse } from 'next/server';
import { z } from 'zod';
import { log } from '@/lib/debugger';

export const runtime = 'nodejs';

const schema = z.object({
  kind: z.string().min(1).max(40),
  path: z.string().max(500).optional(),
  dur: z.number().nonnegative().optional(),
  t: z.number().optional(),
});

// Endpoint for the client beacon to drop nav timings into the debug
// store. Capped to small payloads; bad input is silently rejected so
// noisy clients can't fill the table.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  log('debug', `client/${parsed.data.kind}`, parsed.data.path ?? '', { t: parsed.data.t }, parsed.data.dur);
  return NextResponse.json({ ok: true });
}
