import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { defectPhotos } from '@/lib/defects';
import { all } from '@/lib/db';
import { readUpload } from '@/lib/uploads';
import { guardError } from '../../sites/route';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const row = (all<{ id: number; file_path: string; mime_type: string | null }>(
    `SELECT id, file_path, mime_type FROM defect_photos WHERE id = ?`, [id],
  ))[0];
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const file = readUpload(row.file_path);
  if (!file) return NextResponse.json({ error: 'file gone' }, { status: 404 });

  const stream = file.stream as unknown as ReadableStream;
  return new Response(stream, {
    headers: {
      'Content-Type': row.mime_type ?? 'application/octet-stream',
      'Content-Length': String(file.size),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
