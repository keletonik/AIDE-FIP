import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { batteryProjects } from '@/lib/projects';
import { audit } from '@/lib/audit';
import { guardError } from '../../../sites/route';
import { all } from '@/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  panel_slug: z.string().min(1),
  label: z.string().min(1),
  extra_standby_ma: z.number().min(0).max(20000),
  extra_alarm_ma: z.number().min(0).max(40000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const projectId = parseInt(idStr, 10);
  if (!batteryProjects.get(projectId)) return NextResponse.json({ error: 'project not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const id = batteryProjects.addPanel({
    project_id: projectId,
    panel_slug: parsed.data.panel_slug,
    label: parsed.data.label,
    extra_standby_ma: parsed.data.extra_standby_ma,
    extra_alarm_ma: parsed.data.extra_alarm_ma,
  });
  const panel = (all(`SELECT * FROM battery_project_panels WHERE id = ?`, [id]))[0];
  await audit({ action: 'project.panel.add', target: `${projectId}:${id}` });
  return NextResponse.json({ id, panel });
}
