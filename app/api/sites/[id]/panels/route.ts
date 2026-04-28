import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { sitePanels, sites } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { guardError } from '../../route';

export const runtime = 'nodejs';

const schema = z.object({
  panel_slug: z.string().min(1),
  label: z.string().min(1),
  location: z.string().nullable().optional(),
  install_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const siteId = parseInt(idStr, 10);
  if (!sites.get(siteId)) return NextResponse.json({ error: 'site not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });

  const id = sitePanels.create({
    site_id: siteId,
    panel_slug: parsed.data.panel_slug,
    label: parsed.data.label,
    location: parsed.data.location ?? null,
    install_date: parsed.data.install_date ?? null,
    notes: parsed.data.notes ?? null,
  });
  await audit({ action: 'site_panel.create', target: `${siteId}:${id}`, payload: parsed.data });
  return NextResponse.json({ id, panel: sitePanels.get(id) });
}
