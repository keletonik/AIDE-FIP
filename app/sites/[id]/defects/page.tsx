import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { defects } from '@/lib/defects';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function SiteDefectsPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const siteId = parseInt(id, 10);
  if (!Number.isFinite(siteId)) notFound();
  const site = sites.get(siteId);
  if (!site) notFound();

  await audit({ action: 'site.defects.view', target: String(siteId) });

  const defs = defects.forSite(siteId);
  const open = defs.filter((d) => d.status !== 'resolved');
  const resolved = defs.filter((d) => d.status === 'resolved');
  const canEdit = me.role !== 'viewer';

  return (
    <article className="space-y-6">
      <Link href={`/sites/${siteId}`} className="text-sm text-muted no-underline">← {site.name}</Link>

      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-head">Defects</h1>
        {canEdit && <Link className="btn btn-primary" href={`/sites/${siteId}/defects/new`}>+ Raise defect</Link>}
      </header>

      <Section title={`Open (${open.length})`}>
        {open.length === 0
          ? <p className="text-muted text-sm">No open defects.</p>
          : <DefectsTable rows={open} siteId={siteId} />}
      </Section>

      {resolved.length > 0 && (
        <Section title={`Resolved (${resolved.length})`}>
          <DefectsTable rows={resolved} siteId={siteId} />
        </Section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-head">{title}</h2>
      {children}
    </section>
  );
}

function DefectsTable({ rows, siteId }: { rows: ReturnType<typeof defects.forSite>; siteId: number }) {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead><tr><th>When</th><th>Severity</th><th>Description</th><th>Location</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td className="text-muted text-xs whitespace-nowrap">{d.raised_at}</td>
              <td><SeverityTag s={d.severity} /></td>
              <td className="text-head">
                <Link href={`/sites/${siteId}/defects/${d.id}`} className="no-underline hover:underline">{d.description}</Link>
              </td>
              <td className="text-muted text-sm">{d.location ?? '—'}</td>
              <td><StatusTag s={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeverityTag({ s }: { s: 'low' | 'medium' | 'high' | 'critical' }) {
  const cls = s === 'critical' || s === 'high' ? 'tag tag-warn' : s === 'medium' ? 'tag tag-amber' : 'tag';
  return <span className={cls}>{s}</span>;
}
function StatusTag({ s }: { s: 'open' | 'in_progress' | 'resolved' }) {
  const cls = s === 'resolved' ? 'tag tag-ok' : s === 'in_progress' ? 'tag tag-amber' : 'tag tag-warn';
  return <span className={cls}>{s.replace('_', ' ')}</span>;
}
