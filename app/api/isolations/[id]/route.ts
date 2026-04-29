import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { isolations } from '@/lib/isolations';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const restoreSchema = z.object({
  notes: z.string().max(1000).nullable().optional(),
});

// Restore (close) an active isolation. Use POST not DELETE — the row
// stays as a permanent audit-trail record; we just stamp restored_at.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser(['admin', 'tech']).catch(() => null);
  if (!me) return NextResponse.json({ error: 'auth required' }, { status: 401 });
  const { id } = await params;
  const isoId = parseInt(id, 10);
  if (!Number.isFinite(isoId)) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  const existing = isolations.get(isoId);
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.restored_at) return NextResponse.json({ error: 'already restored' }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const parsed = restoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
  }

  isolations.restore(isoId, me.id, parsed.data.notes ?? null);
  await audit({ actor: me.email, action: 'isolation.restore', target: String(isoId) });

  return NextResponse.json({ ok: true });
}
