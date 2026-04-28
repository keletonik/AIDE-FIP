import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites, sitePanels } from '@/lib/sites';
import { defects } from '@/lib/defects';
import { serviceRecords } from '@/lib/services';
import { brigadeTests } from '@/lib/brigade';
import { ageingReport } from '@/lib/detectors';
import { panels as panelRepo } from '@/lib/repos';
import { ceMatrices } from '@/lib/cematrix';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Site pack' };

// Print-optimised site pack. Browser save-as-PDF gives a serviceable
// handover document — no headless Chromium needed at runtime.
export default async function SitePackPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = sites.get(siteId);
  if (!site) notFound();

  const sps = sitePanels.forSite(siteId);
  const defs = defects.forSite(siteId);
  const recs = serviceRecords.forSite(siteId);
  const tests = brigadeTests.forSite(siteId);
  const ageing = ageingReport(siteId);
  const ces = ceMatrices.forSite(siteId);
  const panelLookup = new Map(panelRepo.list().map(p => [p.slug, p]));

  return (
    <article className="space-y-6 print:space-y-4 print:text-black print:bg-white">
      <header className="space-y-1 border-b border-line pb-3 print:border-black">
        <h1 className="text-2xl font-bold">{site.name}</h1>
        <div className="text-sm">{[site.address, site.suburb, site.postcode].filter(Boolean).join(' · ')}</div>
        {(site.contact_name || site.contact_phone) && (
          <div className="text-sm">Contact: {site.contact_name}{site.contact_phone ? ` · ${site.contact_phone}` : ''}</div>
        )}
        <div className="text-xs text-muted print:text-gray-700">Generated {new Date().toLocaleString()} · {me.name}</div>
      </header>

      <div className="flex gap-2 print:hidden">
        <PrintButton />
      </div>

      <Section title="Panels">
        {sps.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>Label</th><th>Model</th><th>Location</th><th>Installed</th></tr></thead>
            <tbody>
              {sps.map(sp => {
                const p = panelLookup.get(sp.panel_slug);
                return (
                  <tr key={sp.id}>
                    <td>{sp.label}</td>
                    <td>{p?.name ?? sp.panel_slug}</td>
                    <td>{sp.location ?? '—'}</td>
                    <td>{sp.install_date ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Open defects">
        {defs.filter(d => d.status !== 'resolved').length === 0 ? <Empty label="None open." /> : (
          <table>
            <thead><tr><th>Severity</th><th>Description</th><th>Location</th><th>Raised</th><th>Status</th></tr></thead>
            <tbody>
              {defs.filter(d => d.status !== 'resolved').map(d => (
                <tr key={d.id}>
                  <td>{d.severity}</td>
                  <td>{d.description}</td>
                  <td>{d.location ?? '—'}</td>
                  <td className="text-xs">{d.raised_at}</td>
                  <td>{d.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Service records">
        {recs.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>When</th><th>Template</th><th>Result</th><th>By</th></tr></thead>
            <tbody>
              {recs.map(r => (
                <tr key={r.id}>
                  <td className="text-xs">{r.performed_at}</td>
                  <td>{r.template_label}</td>
                  <td>{r.overall}</td>
                  <td>{r.performed_by_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Brigade tests">
        {tests.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>When</th><th>Line</th><th>Centre</th><th>Signal</th><th>Response</th><th>Witnesses</th></tr></thead>
            <tbody>
              {tests.map(t => (
                <tr key={t.id}>
                  <td className="text-xs">{t.performed_at}</td>
                  <td>{t.line_id ?? '—'}</td>
                  <td>{t.monitoring_centre ?? '—'}</td>
                  <td>{t.ase_signal_received ? 'received' : 'NOT received'}</td>
                  <td>{t.response_seconds != null ? `${t.response_seconds} s` : '—'}</td>
                  <td>{t.witnesses ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Cause and effect">
        {ces.length === 0 ? <Empty /> : (
          <div className="space-y-4">
            {ces.map(m => (
              <div key={m.id}>
                <h3 className="font-semibold">{m.name}</h3>
                <table className="text-xs">
                  <thead>
                    <tr>
                      <th></th>
                      {m.outputs.map((o, i) => <th key={i}>{o}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {m.zones.map((z, zi) => (
                      <tr key={zi}>
                        <th>{z}</th>
                        {m.outputs.map((_, oi) => <td key={oi} className="text-center">{m.cells[zi]?.[oi] || '·'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Detector ageing">
        {ageing.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>Address</th><th>Type</th><th>Panel</th><th>Installed</th><th>Replace by</th><th>Bucket</th></tr></thead>
            <tbody>
              {ageing.map(d => (
                <tr key={d.id}>
                  <td className="font-mono">{d.address}</td>
                  <td>{d.type}</td>
                  <td>{d.panel_label}</td>
                  <td className="text-xs">{d.install_date ?? '—'}</td>
                  <td className="text-xs">{d.replace_by_calc ?? '—'}</td>
                  <td>{d.bucket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 print:break-inside-avoid">
      <h2 className="text-lg font-semibold border-b border-line pb-1 print:border-black">{title}</h2>
      {children}
    </section>
  );
}
function Empty({ label = '—' }: { label?: string }) {
  return <p className="text-muted text-sm">{label}</p>;
}
