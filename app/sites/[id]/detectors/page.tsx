import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites, sitePanels } from '@/lib/sites';
import { ageingReport } from '@/lib/detectors';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Detectors' };

export default async function DetectorsPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = sites.get(siteId);
  if (!site) notFound();

  const list = ageingReport(siteId);
  const panels = sitePanels.forSite(siteId);

  return (
    <div className="space-y-4">
      <Link href={`/sites/${siteId}`} className="text-sm text-muted no-underline">← {site.name}</Link>
      <h1 className="text-2xl font-bold text-head">Detectors at {site.name}</h1>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <Card label="Overdue"   value={list.filter(d => d.bucket === 'overdue').length}   accent="warn" />
        <Card label="Due soon"  value={list.filter(d => d.bucket === 'due-soon').length}  accent="amber" />
        <Card label="Total"     value={list.length} />
      </div>

      {panels.length === 0 && <p className="text-muted text-sm">Add a panel before you can register detectors.</p>}

      {panels.map(p => (
        <section key={p.id} className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg text-head">{p.label}</h2>
            <Link className="btn" href={`/sites/${siteId}/panels/${p.id}/detectors`}>Manage →</Link>
          </div>
        </section>
      ))}

      <table>
        <thead><tr><th>Address</th><th>Type</th><th>Panel</th><th>Location</th><th>Installed</th><th>Replace by</th><th>Age</th><th></th></tr></thead>
        <tbody>
          {list.map(d => (
            <tr key={d.id}>
              <td className="text-head font-mono">{d.address}</td>
              <td>{d.type}</td>
              <td>{d.panel_label}</td>
              <td className="text-muted text-sm">{d.location ?? ''}</td>
              <td className="text-muted text-sm">{d.install_date ?? '—'}</td>
              <td className="text-muted text-sm">{d.replace_by_calc ?? '—'}</td>
              <td>{d.age_years ?? '—'}{d.age_years != null ? ' yr' : ''}</td>
              <td>
                {d.bucket === 'overdue' && <span className="tag tag-warn">overdue</span>}
                {d.bucket === 'due-soon' && <span className="tag tag-amber">soon</span>}
                {d.bucket === 'ok' && <span className="tag tag-ok">ok</span>}
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={8} className="text-muted">No detectors registered.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: 'warn' | 'amber' }) {
  const cls = accent === 'warn' ? 'border-warn text-warn' : accent === 'amber' ? 'border-amber text-amber' : 'border-line text-head';
  return (
    <div className={`p-3 rounded-md border ${cls}`}>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
