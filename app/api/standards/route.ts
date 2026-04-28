import { NextResponse } from 'next/server';
import { standards } from '@/lib/repos';
import { kb } from '@/lib/kb';
import { track } from '@/lib/debugger';

export const runtime = 'nodejs';

// Lightweight JSON contract for the knowledge-bage integration. Mirrors
// the shape recommended in BUILD.md: id, title, clauses[], updatedAt.
export async function GET(req: Request) {
  return track('api/standards', 'GET', async () => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        standards: standards.list().map(s => ({ id: s.id, title: s.title, year: s.year })),
      });
    }

    const std = standards.get(id);
    if (!std) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const clauses = standards.clauses(id).map(c => ({
      number: c.number, title: c.title, summary: c.paraphrase, url: kb.standard(id, c.number),
    }));
    return NextResponse.json(
      {
        id: std.id, title: std.title, summary: std.summary,
        year: std.year, authority: std.authority, clauses,
        kbUrl: kb.standard(id),
        updatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } },
    );
  });
}
