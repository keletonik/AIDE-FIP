import Link from 'next/link';
import { notFound } from 'next/navigation';
import { panels } from '@/lib/repos';
import { all } from '@/lib/db';
import { kb } from '@/lib/kb';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function PanelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const panel = panels.get(slug);
  if (!panel) notFound();

  const cmds = panels.commands(slug);
  const loads = all<{ mode: string; current_ma: number; source: string | null }>(
    `SELECT mode, current_ma, source FROM battery_loads WHERE panel_slug = ? ORDER BY mode`,
    [slug],
  );

  await audit({ action: 'panel.view', target: slug });

  // Group commands by context for cleaner section headers.
  const byCtx: Record<string, typeof cmds> = {};
  for (const c of cmds) (byCtx[c.context] ??= []).push(c);

  return (
    <article className="space-y-6">
      <Link href="/panels" className="text-sm text-muted no-underline">← Panels</Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-head">{panel.name}</h1>
        <div className="text-muted text-sm">{panel.vendor}{panel.family ? ` · ${panel.family}` : ''}</div>
        {panel.notes && <p className="text-body mt-2">{panel.notes}</p>}
      </header>

      <div className="flex flex-wrap gap-2">
        {panel.kb_slug && (
          <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={kb.panel(panel.kb_slug)}>
            Manual in knowledge base ↗
          </a>
        )}
        <Link className="btn" href={`/panels/${panel.slug}/programming`}>Programming reference →</Link>
        <Link className="btn" href={`/battery?panel=${panel.slug}`}>Battery calc →</Link>
        <Link className="btn" href="/loop-calc">Loop voltage-drop →</Link>
      </div>

      {Object.entries(byCtx).map(([ctx, list]) => (
        <section key={ctx} className="space-y-2">
          <h2 className="text-lg font-semibold text-head">{ctx}</h2>
          <table>
            <thead><tr><th>Action</th><th>Keystrokes</th><th>Notes</th></tr></thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id}>
                  <td className="text-head">{c.label}</td>
                  <td><span className="kbd">{c.keystrokes}</span></td>
                  <td className="text-muted">{c.notes ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {loads.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-head">Battery seed loads</h2>
          <table>
            <thead><tr><th>Mode</th><th>Current</th><th>Source</th></tr></thead>
            <tbody>
              {loads.map((l, i) => (
                <tr key={i}>
                  <td className="text-head">{l.mode}</td>
                  <td>{l.current_ma.toFixed(0)} mA</td>
                  <td className="text-muted text-sm">{l.source ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted">Verify on the as-installed panel — manuals quote new-unit values, not your site config.</p>
        </section>
      )}
    </article>
  );
}
