import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { batteryProjects } from '@/lib/projects';
import { calculateProject } from '@/lib/battery';
import { guardError } from '../../../sites/route';

export const runtime = 'nodejs';

// POST so it never gets cached. Body is the project ID via URL.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const project = batteryProjects.get(parseInt(idStr, 10));
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const panels = batteryProjects.panels(project.id);

  const result = calculateProject({
    panels: panels.map(p => ({
      panelSlug: p.panel_slug, label: p.label,
      extraStandbyMa: p.extra_standby_ma, extraAlarmMa: p.extra_alarm_ma,
    })),
    standbyHours: project.standby_hours,
    alarmMinutes: project.alarm_minutes,
    ageingFactor: project.ageing_factor,
  });
  return NextResponse.json(result);
}
