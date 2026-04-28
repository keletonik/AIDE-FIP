import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { sitePanels } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { guardError } from '../../../route';

export const runtime = 'nodejs';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; panelId: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id, panelId } = await params;
  sitePanels.remove(parseInt(panelId, 10));
  await audit({ action: 'site_panel.delete', target: `${id}:${panelId}` });
  return NextResponse.json({ ok: true });
}
