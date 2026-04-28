import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, AuthRequired, Forbidden } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { audit } from '@/lib/audit';
import { track } from '@/lib/debugger';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(''),
  suburb: z.string().optional().default(''),
  postcode: z.string().optional().default(''),
  contact_name: z.string().optional().default(''),
  contact_phone: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export async function POST(req: Request) {
  return track('api/sites', 'POST', async () => {
    let me;
    try { me = await requireUser(['admin', 'tech']); }
    catch (e) { return guardError(e); }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });

    const id = sites.create({
      name: parsed.data.name,
      address: parsed.data.address || null,
      suburb: parsed.data.suburb || null,
      postcode: parsed.data.postcode || null,
      contact_name: parsed.data.contact_name || null,
      contact_phone: parsed.data.contact_phone || null,
      notes: parsed.data.notes || null,
      created_by: me.id,
    });
    await audit({ action: 'site.create', target: String(id), payload: { name: parsed.data.name } });
    return NextResponse.json({ id });
  });
}

export function guardError(e: unknown) {
  if (e instanceof AuthRequired) return NextResponse.json({ error: 'auth required' }, { status: 401 });
  if (e instanceof Forbidden) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  throw e;
}
