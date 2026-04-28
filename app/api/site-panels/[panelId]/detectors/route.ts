import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { detectors } from '@/lib/detectors';
import { sitePanels } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { guardError } from '../../../sites/route';

export const runtime = 'nodejs';

const schema = z.object({
  address: z.string().min(1),
  type: z.string().min(1),
  location: z.string().nullable().optional(),
  install_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ panelId: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { panelId } = await params;
  const sp = sitePanels.get(parseInt(panelId, 10));
  if (!sp) return NextResponse.json({ error: 'panel not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const id = detectors.create({
    site_panel_id: sp.id,
    address: parsed.data.address,
    type: parsed.data.type,
    location: parsed.data.location ?? null,
    install_date: parsed.data.install_date ?? null,
    last_tested_at: null,
    replace_by: null,
    notes: parsed.data.notes ?? null,
  });
  await audit({ action: 'detector.create', target: `${sp.id}:${id}` });
  return NextResponse.json({ id, detector: detectors.get(id) });
}
