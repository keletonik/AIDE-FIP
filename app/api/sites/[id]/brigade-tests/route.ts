import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { brigadeTests } from '@/lib/brigade';
import { audit } from '@/lib/audit';
import { guardError } from '../../route';

export const runtime = 'nodejs';

const schema = z.object({
  line_id: z.string().nullable().optional(),
  monitoring_centre: z.string().nullable().optional(),
  ase_signal_received: z.boolean(),
  response_seconds: z.number().int().nonnegative().nullable().optional(),
  witnesses: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let me;
  try { me = await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const siteId = parseInt(idStr, 10);
  if (!sites.get(siteId)) return NextResponse.json({ error: 'site not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });

  const id = brigadeTests.create({
    site_id: siteId,
    performed_by: me.id,
    line_id: parsed.data.line_id ?? null,
    monitoring_centre: parsed.data.monitoring_centre ?? null,
    ase_signal_received: parsed.data.ase_signal_received ? 1 : 0,
    response_seconds: parsed.data.response_seconds ?? null,
    witnesses: parsed.data.witnesses ?? null,
    notes: parsed.data.notes ?? null,
  });
  await audit({ action: 'brigade.create', target: `${siteId}:${id}`, payload: { received: parsed.data.ase_signal_received } });
  return NextResponse.json({ id });
}
