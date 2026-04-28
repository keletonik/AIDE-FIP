import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { defectPhotos, defects } from '@/lib/defects';
import { DefectActions } from './DefectActions';

export const dynamic = 'force-dynamic';

export default async function DefectPage({ params }: { params: Promise<{ id: string; defectId: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id, defectId } = await params;
  const siteId = parseInt(id, 10);
  const did = parseInt(defectId, 10);
  const site = sites.get(siteId);
  const def = defects.get(did);
  if (!site || !def || def.site_id !== siteId) notFound();
  const photos = defectPhotos.forDefect(did);

  return (
    <article className="space-y-4">
      <Link href={`/sites/${siteId}`} className="text-sm text-muted no-underline">← {site.name}</Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-head">{def.description}</h1>
        <div className="text-sm text-muted">
          {def.severity} · {def.status.replace('_', ' ')} · raised {def.raised_at}
          {def.location ? ` · ${def.location}` : ''}
        </div>
      </header>

      {photos.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map(p => (
            <a key={p.id} href={`/api/defect-photos/${p.id}`} target="_blank" rel="noopener noreferrer" className="card overflow-hidden">
              <img src={`/api/defect-photos/${p.id}`} alt={p.caption ?? ''} className="w-full h-40 object-cover" />
              {p.caption && <div className="text-xs text-muted p-2">{p.caption}</div>}
            </a>
          ))}
        </section>
      )}

      {def.resolution && (
        <section className="card p-3">
          <h2 className="text-sm uppercase tracking-wide text-muted mb-1">Resolution</h2>
          <p className="text-body">{def.resolution}</p>
          <div className="text-xs text-muted mt-1">at {def.resolved_at}</div>
        </section>
      )}

      {me.role !== 'viewer' && (
        <DefectActions siteId={siteId} defectId={did} status={def.status} />
      )}
    </article>
  );
}
