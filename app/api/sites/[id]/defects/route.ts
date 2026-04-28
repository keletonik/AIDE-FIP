import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { defects } from '@/lib/defects';
import { sites } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { guardError } from '../../route';

export const runtime = 'nodejs';

const schema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(3),
  location: z.string().nullable().optional(),
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

  const id = defects.create({
    site_id: siteId,
    severity: parsed.data.severity,
    description: parsed.data.description,
    location: parsed.data.location ?? null,
    raised_by: me.id,
  });
  await audit({ action: 'defect.create', target: `${siteId}:${id}`, payload: parsed.data });
  return NextResponse.json({ id });
}
