import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { detectors } from '@/lib/detectors';
import { audit } from '@/lib/audit';
import { guardError } from '../../../../sites/route';

export const runtime = 'nodejs';

const schema = z.object({
  address: z.string().optional(),
  type: z.string().optional(),
  location: z.string().nullable().optional(),
  install_date: z.string().nullable().optional(),
  last_tested_at: z.string().nullable().optional(),
  replace_by: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ detectorId: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }
  const { detectorId } = await params;
  const id = parseInt(detectorId, 10);
  if (!detectors.get(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  detectors.update(id, parsed.data);
  await audit({ action: 'detector.update', target: String(id), payload: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ detectorId: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }
  const { detectorId } = await params;
  const id = parseInt(detectorId, 10);
  detectors.remove(id);
  await audit({ action: 'detector.delete', target: String(id) });
  return NextResponse.json({ ok: true });
}
