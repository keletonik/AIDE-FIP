import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { defectPhotos, defects } from '@/lib/defects';
import { saveImage } from '@/lib/uploads';
import { audit } from '@/lib/audit';
import { guardError } from '../../../sites/route';
import { warn } from '@/lib/debugger';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(['admin', 'tech']); }
  catch (e) { return guardError(e); }

  const { id: idStr } = await params;
  const defectId = parseInt(idStr, 10);
  if (!defects.get(defectId)) return NextResponse.json({ error: 'defect not found' }, { status: 404 });

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: 'bad multipart' }, { status: 400 }); }

  const files = form.getAll('photo').filter((x): x is File => x instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'no photo files' }, { status: 400 });

  const saved: number[] = [];
  const rejected: { name: string; type: string; reason: string }[] = [];
  for (const f of files) {
    try {
      const out = await saveImage('defects', String(defectId), f);
      const id = defectPhotos.add({
        defect_id: defectId, file_path: out.path, mime_type: out.mime, size_bytes: out.size, caption: null,
      });
      saved.push(id);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      rejected.push({ name: f.name, type: f.type, reason });
      warn('api/defects/photos', 'rejected file', { name: f.name, type: f.type, reason });
    }
  }
  if (saved.length === 0) {
    // Every file was rejected — return 400 so the client knows nothing
    // landed. Previously this returned 200 with an empty ids array, which
    // looked like success.
    return NextResponse.json({ error: 'no valid photos', rejected }, { status: 400 });
  }
  await audit({ action: 'defect.photos.upload', target: String(defectId), payload: { count: saved.length, rejected: rejected.length } });
  return NextResponse.json({ ok: true, ids: saved, rejected });
}
