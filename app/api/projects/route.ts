import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { batteryProjects } from '@/lib/projects';
import { audit } from '@/lib/audit';
import { guardError } from '../sites/route';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().min(1),
  site_id: z.number().int().positive().nullable().optional(),
  standby_hours: z.number().int().min(1).max(72),
  alarm_minutes: z.number().int().min(1).max(240),
  ageing_factor: z.number().min(1).max(2),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  let me;
  try { me = await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const id = batteryProjects.create({
    name: parsed.data.name,
    site_id: parsed.data.site_id ?? null,
    standby_hours: parsed.data.standby_hours,
    alarm_minutes: parsed.data.alarm_minutes,
    ageing_factor: parsed.data.ageing_factor,
    notes: parsed.data.notes ?? null,
    created_by: me.id,
  });
  await audit({ action: 'project.create', target: String(id), payload: { name: parsed.data.name } });
  return NextResponse.json({ id });
}
