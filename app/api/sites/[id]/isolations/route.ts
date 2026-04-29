import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { isolations, type IsolationScope } from '@/lib/isolations';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const createSchema = z.object({
  scope: z.enum(['point', 'zone', 'loop', 'sounder', 'output', 'panel']),
  target: z.string().min(1).max(120),
  reason: z.string().min(1).max(500),
  site_panel_id: z.number().int().nullable().optional(),
  expected_restore_at: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: 'auth required' }, { status: 401 });
  const { id } = await params;
  const siteId = parseInt(id, 10);
  if (!Number.isFinite(siteId)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  const list = isolations.forSite(siteId);
  return NextResponse.json({ isolations: list });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser(['admin', 'tech']).catch(() => null);
  if (!me) return NextResponse.json({ error: 'auth required' }, { status: 401 });
  const { id } = await params;
  const siteId = parseInt(id, 10);
  if (!Number.isFinite(siteId)) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
  }

  const newId = isolations.create({
    site_id: siteId,
    site_panel_id: parsed.data.site_panel_id ?? null,
    scope: parsed.data.scope as IsolationScope,
    target: parsed.data.target,
    reason: parsed.data.reason,
    expected_restore_at: parsed.data.expected_restore_at ?? null,
    isolated_by: me.id,
    notes: parsed.data.notes ?? null,
  });

  await audit({
    actor: me.email, action: 'isolation.create', target: `${siteId}:${newId}`,
    payload: { scope: parsed.data.scope, target: parsed.data.target },
  });

  return NextResponse.json({ id: newId });
}
