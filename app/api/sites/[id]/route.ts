import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { guardError } from '../route';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  postcode: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!sites.get(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });

  sites.update(id, Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, (v === '' ? null : v)]),
  ));
  await audit({ action: 'site.update', target: String(id), payload: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(['admin']); }
  catch (e) { return guardError(e); }
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  sites.remove(id);
  await audit({ action: 'site.delete', target: String(id) });
  return NextResponse.json({ ok: true });
}
