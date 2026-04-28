import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ceMatrices } from '@/lib/cematrix';
import { sites } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { guardError } from '../sites/route';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().min(1),
  zones: z.array(z.string()).min(1),
  outputs: z.array(z.string()).min(1),
  cells: z.array(z.array(z.string())).min(1),
});

export async function POST(req: Request) {
  let me;
  try { me = await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const url = new URL(req.url);
  const siteId = parseInt(url.searchParams.get('site') ?? '', 10);
  if (!siteId || !sites.get(siteId)) return NextResponse.json({ error: 'site required' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const id = ceMatrices.create({
    site_id: siteId,
    name: parsed.data.name,
    zones: parsed.data.zones,
    outputs: parsed.data.outputs,
    cells: parsed.data.cells,
    updated_by: me.id,
  });
  await audit({ action: 'ce.create', target: `${siteId}:${id}`, payload: { name: parsed.data.name } });
  return NextResponse.json({ id });
}
