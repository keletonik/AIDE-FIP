import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { serviceRecords, serviceTemplates } from '@/lib/services';
import { audit } from '@/lib/audit';
import { guardError } from '../../route';

export const runtime = 'nodejs';

const schema = z.object({
  template_id: z.number().int().positive(),
  overall: z.enum(['pass', 'partial', 'fail']),
  notes: z.string().nullable().optional(),
  results: z.array(z.object({ item: z.string(), pass: z.boolean(), notes: z.string() })).min(1),
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

  if (!serviceTemplates.get(parsed.data.template_id)) {
    return NextResponse.json({ error: 'template not found' }, { status: 400 });
  }

  const id = serviceRecords.create({
    site_id: siteId,
    template_id: parsed.data.template_id,
    performed_by: me.id,
    results: parsed.data.results,
    overall: parsed.data.overall,
    notes: parsed.data.notes ?? null,
  });
  await audit({ action: 'service.create', target: `${siteId}:${id}`, payload: { template_id: parsed.data.template_id, overall: parsed.data.overall } });
  return NextResponse.json({ id });
}
