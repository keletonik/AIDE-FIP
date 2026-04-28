import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBattery } from '@/lib/battery';
import { audit } from '@/lib/audit';
import { track, warn } from '@/lib/debugger';

export const runtime = 'nodejs';

const schema = z.object({
  panelSlug:        z.string().min(1),
  standbyHours:     z.number().min(1).max(72),
  alarmMinutes:     z.number().min(1).max(240),
  extraStandbyMa:   z.number().min(0).max(5000).optional(),
  extraAlarmMa:     z.number().min(0).max(20000).optional(),
  ageingFactor:     z.number().min(1).max(2).optional(),
});

export async function POST(req: Request) {
  return track('api/battery', 'POST', async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      warn('api/battery', 'invalid input', parsed.error.flatten());
      return NextResponse.json({ error: 'invalid input', detail: parsed.error.flatten() }, { status: 400 });
    }
    const result = calculateBattery(parsed.data);
    await audit({ action: 'battery.calc', target: parsed.data.panelSlug, payload: parsed.data });
    return NextResponse.json(result);
  });
}
