import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites, sitePanels } from '@/lib/sites';
import { defects } from '@/lib/defects';
import { serviceRecords } from '@/lib/services';
import { brigadeTests } from '@/lib/brigade';
import { ceMatrices } from '@/lib/cematrix';
import { detectors, ageingReport } from '@/lib/detectors';
import { isolations } from '@/lib/isolations';
import { panels as panelRepo } from '@/lib/repos';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = sites.get(siteId);
  if (!site) notFound();

  await audit({ action: 'site.view', target: String(siteId) });

  const sps   = sitePanels.forSite(siteId);
  const defs  = defects.forSite(siteId);
  const open  = defs.filter(d => d.status !== 'resolved');
  const recs  = serviceRecords.forSite(siteId).slice(0, 5);
  const tests = brigadeTests.forSite(siteId).slice(0, 5);
  const ces   = ceMatrices.forSite(siteId);
  const ageing = ageingReport(siteId);
  const overdue   = ageing.filter(d => d.bucket === 'overdue').length;
  const dueSoon   = ageing.filter(d => d.bucket === 'due-soon').length;
  const activeIsolations = isolations.activeForSite(siteId).length;

  const panelLookup = new Map(panelRepo.list().map(p => [p.slug, p]));

  const canEdit = me.role !== 'viewer';

  return (
    <article className="space-y-6">
      <Link href="/sites" className="text-sm text-muted no-underline">← Sites</Link>

      <header className="space-y-1">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-head">{site.name}</h1>
          <div className="flex gap-2">
            {canEdit && <Link className="btn" href={`/sites/${siteId}/edit`}>Edit</Link>}
            <Link className="btn" href={`/sites/${siteId}/print`}>Site pack ↗</Link>
          </div>
        </div>
        <div className="text-muted text-sm">
          {[site.address, site.suburb, site.postcode].filter(Boolean).join(' · ') || 'No address recorded'}
        </div>
        {(site.contact_name || site.contact_phone) && (
          <div className="text-sm text-body">Contact: {site.contact_name}{site.contact_phone ? ` · ${site.contact_phone}` : ''}</div>
        )}
        {site.notes && <p className="text-body mt-2">{site.notes}</p>}
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Open defects" value={open.length} accent={open.length > 0 ? 'warn' : null} href={`/sites/${siteId}/defects`} />
        <Stat label="Panels"       value={sps.length} href={`/sites/${siteId}/panels`} />
        <Stat label="Active isolations" value={activeIsolations} accent={activeIsolations > 0 ? 'warn' : null} href={`/sites/${siteId}/isolations`} />
        <Stat label="Detectors overdue" value={overdue} accent={overdue > 0 ? 'warn' : null} href={`/sites/${siteId}/detectors`} />
      </div>

      <Section title="Panels" actions={canEdit ? <Link className="btn" href={`/sites/${siteId}/panels`}>Manage →</Link> : null}>
        {sps.length === 0
          ? <p className="text-muted text-sm">No panels linked yet.</p>
          : (
            <ul className="grid sm:grid-cols-2 gap-2">
              {sps.map(sp => {
                const p = panelLookup.get(sp.panel_slug);
                return (
                  <li key={sp.id} className="card p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-head">{sp.label}</span>
                      <span className="tag">{p?.name ?? sp.panel_slug}</span>
                    </div>
                    {sp.location && <div className="text-xs text-muted mt-1">{sp.location}</div>}
                  </li>
                );
              })}
            </ul>
          )}
      </Section>

      {activeIsolations > 0 && (
        <Section title="Active isolations" actions={<Link className="btn" href={`/sites/${siteId}/isolations`}>Manage →</Link>}>
          <p className="text-warn text-sm">
            ⚠ {activeIsolations} active isolation{activeIsolations === 1 ? '' : 's'} on this site.
            Restore before leaving site.
          </p>
        </Section>
      )}

      <Section title="Defects" actions={canEdit ? <Link className="btn btn-primary" href={`/sites/${siteId}/defects/new`}>+ Raise defect</Link> : null}>
        {defs.length === 0
          ? <p className="text-muted text-sm">No defects recorded.</p>
          : (
            <table>
              <thead><tr><th>When</th><th>Severity</th><th>Description</th><th>Status</th></tr></thead>
              <tbody>
                {defs.slice(0, 8).map(d => (
                  <tr key={d.id}>
                    <td className="text-muted text-xs whitespace-nowrap">{d.raised_at}</td>
                    <td><SeverityTag s={d.severity} /></td>
                    <td className="text-head"><Link href={`/sites/${siteId}/defects/${d.id}`} className="no-underline hover:underline">{d.description}</Link></td>
                    <td><StatusTag s={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Section>

      <Section title="Service records (AS 1851)" actions={canEdit ? <Link className="btn" href={`/sites/${siteId}/service/new`}>+ New service</Link> : null}>
        {recs.length === 0
          ? <p className="text-muted text-sm">No service records yet.</p>
          : (
            <table>
              <thead><tr><th>When</th><th>Template</th><th>Result</th><th>By</th></tr></thead>
              <tbody>
                {recs.map(r => (
                  <tr key={r.id}>
                    <td className="text-muted text-xs">{r.performed_at}</td>
                    <td className="text-head">{r.template_label}</td>
                    <td><OverallTag s={r.overall} /></td>
                    <td className="text-muted text-sm">{r.performed_by_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Section>

      <Section title="Brigade tests" actions={canEdit ? <Link className="btn" href={`/sites/${siteId}/brigade/new`}>+ Log brigade test</Link> : null}>
        {tests.length === 0
          ? <p className="text-muted text-sm">No brigade tests recorded.</p>
          : (
            <table>
              <thead><tr><th>When</th><th>Line</th><th>Centre</th><th>Signal</th><th>Response</th></tr></thead>
              <tbody>
                {tests.map(t => (
                  <tr key={t.id}>
                    <td className="text-muted text-xs">{t.performed_at}</td>
                    <td>{t.line_id ?? '—'}</td>
                    <td>{t.monitoring_centre ?? '—'}</td>
                    <td>{t.ase_signal_received ? <span className="tag tag-ok">received</span> : <span className="tag tag-warn">no</span>}</td>
                    <td>{t.response_seconds != null ? `${t.response_seconds} s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Section>

      <Section title="Cause-and-effect" actions={canEdit ? <Link className="btn" href={`/sites/${siteId}/ce`}>Open editor →</Link> : null}>
        {ces.length === 0
          ? <p className="text-muted text-sm">No matrices yet.</p>
          : (
            <ul className="space-y-1">
              {ces.map(m => (
                <li key={m.id} className="text-body">
                  <Link href={`/sites/${siteId}/ce?id=${m.id}`}>{m.name}</Link>
                  <span className="text-muted text-xs ml-2">{m.zones.length} zones × {m.outputs.length} outputs · updated {m.updated_at}</span>
                </li>
              ))}
            </ul>
          )}
      </Section>
    </article>
  );
}

function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-head">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
function Stat({ label, value, accent, href }: { label: string; value: number; accent?: 'warn' | 'amber' | null; href?: string }) {
  const cls = accent === 'warn' ? 'border-warn text-warn' : accent === 'amber' ? 'border-amber text-amber' : 'border-line text-head';
  const inner = (
    <div className={`p-3 rounded-md border ${cls}`}>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
  return href ? <Link href={href} className="no-underline">{inner}</Link> : inner;
}
function SeverityTag({ s }: { s: 'low' | 'medium' | 'high' | 'critical' }) {
  const cls = s === 'critical' || s === 'high' ? 'tag tag-warn' : s === 'medium' ? 'tag tag-amber' : 'tag';
  return <span className={cls}>{s}</span>;
}
function StatusTag({ s }: { s: 'open' | 'in_progress' | 'resolved' }) {
  const cls = s === 'resolved' ? 'tag tag-ok' : s === 'in_progress' ? 'tag tag-amber' : 'tag tag-warn';
  return <span className={cls}>{s.replace('_', ' ')}</span>;
}
function OverallTag({ s }: { s: 'pass' | 'partial' | 'fail' }) {
  const cls = s === 'pass' ? 'tag tag-ok' : s === 'partial' ? 'tag tag-amber' : 'tag tag-warn';
  return <span className={cls}>{s}</span>;
}
