import { NextResponse } from 'next/server';
import { causesFor, getSymptom, listSymptoms, searchSymptoms } from '@/lib/troubleshoot';
import { audit } from '@/lib/audit';
import { track } from '@/lib/debugger';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  return track('api/troubleshoot', 'GET', async () => {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const q = url.searchParams.get('q');

    if (slug) {
      const sym = getSymptom(slug);
      if (!sym) return NextResponse.json({ error: 'not found' }, { status: 404 });
      const causes = causesFor(slug);
      await audit({ action: 'troubleshoot.view', target: slug });
      return NextResponse.json({ symptom: sym, causes });
    }

    if (q) {
      await audit({ action: 'troubleshoot.search', payload: { q } });
      return NextResponse.json({ symptoms: searchSymptoms(q) });
    }

    return NextResponse.json({ symptoms: listSymptoms() });
  });
}
