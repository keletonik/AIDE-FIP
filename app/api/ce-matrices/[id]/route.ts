import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ceMatrices } from '@/lib/cematrix';
import { audit } from '@/lib/audit';
import { guardError } from '../../sites/route';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().min(1),
  zones: z.array(z.string()).min(1),
  outputs: z.array(z.string()).min(1),
  cells: z.array(z.array(z.string())).min(1),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let me;
  try { me = await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const m = ceMatrices.get(id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  ceMatrices.update(id, { ...parsed.data, updated_by: me.id });
  await audit({ action: 'ce.update', target: String(id) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(['admin']); }
  catch (e) { return guardError(e); }
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  ceMatrices.remove(id);
  await audit({ action: 'ce.delete', target: String(id) });
  return NextResponse.json({ ok: true });
}
