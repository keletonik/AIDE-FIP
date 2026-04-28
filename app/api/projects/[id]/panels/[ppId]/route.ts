import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { batteryProjects } from '@/lib/projects';
import { audit } from '@/lib/audit';
import { guardError } from '../../../../sites/route';

export const runtime = 'nodejs';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; ppId: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }
  const { id, ppId } = await params;
  batteryProjects.removePanel(parseInt(ppId, 10));
  await audit({ action: 'project.panel.remove', target: `${id}:${ppId}` });
  return NextResponse.json({ ok: true });
}
