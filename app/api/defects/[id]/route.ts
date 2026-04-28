import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { defects } from '@/lib/defects';
import { audit } from '@/lib/audit';
import { guardError } from '../../sites/route';

export const runtime = 'nodejs';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('in_progress') }),
  z.object({ action: z.literal('reopen') }),
  z.object({ action: z.literal('resolve'), resolution: z.string().min(1) }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let me;
  try { me = await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const def = defects.get(id);
  if (!def) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  if (parsed.data.action === 'in_progress') defects.setStatus(id, 'in_progress');
  else if (parsed.data.action === 'reopen') defects.reopen(id);
  else defects.resolve(id, me.id, parsed.data.resolution);

  await audit({ action: `defect.${parsed.data.action}`, target: String(id) });
  return NextResponse.json({ ok: true });
}
