import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { isolations, hoursSince } from '@/lib/isolations';
import { IsolationActions } from './IsolationActions';

export const dynamic = 'force-dynamic';

export default async function SiteIsolationsPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const siteId = parseInt(id, 10);
  if (!Number.isFinite(siteId)) notFound();
  const site = sites.get(siteId);
  if (!site) notFound();

  const all = isolations.forSite(siteId);
  const active = all.filter((i) => !i.restored_at);
  const past = all.filter((i) => i.restored_at);
  const canEdit = me.role !== 'viewer';

  return (
    <article className="space-y-6">
      <Link href={`/sites/${siteId}`} className="text-sm text-muted no-underline">← {site.name}</Link>
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-head">Isolations</h1>
        {canEdit && (
          <Link className="btn btn-primary" href={`/sites/${siteId}/isolations/new`}>+ Log isolation</Link>
        )}
      </header>

      <Section title={`Active (${active.length})`}>
        {active.length === 0 ? (
          <p className="text-muted text-sm">No active isolations on this site.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((i) => (
              <li key={i.id} className="card p-3 space-y-2">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="tag">{i.scope}</span>
                      <span className="text-head font-semibold">{i.target}</span>
                    </div>
                    <p className="text-sm text-body">{i.reason}</p>
                  </div>
                  <div className="text-right text-xs text-muted whitespace-nowrap">
                    <div>since {fmtHrs(hoursSince(i.isolated_at))}</div>
                    {i.expected_restore_at && <div>expected {i.expected_restore_at}</div>}
                  </div>
                </div>
                {canEdit && <IsolationActions id={i.id} />}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {past.length > 0 && (
        <Section title={`Restored (${past.length})`}>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Scope</th><th>Target</th><th>Isolated</th><th>Restored</th><th>Reason</th></tr></thead>
              <tbody>
                {past.slice(0, 50).map((i) => (
                  <tr key={i.id}>
                    <td><span className="tag">{i.scope}</span></td>
                    <td className="text-head">{i.target}</td>
                    <td className="text-muted text-xs whitespace-nowrap">{i.isolated_at}</td>
                    <td className="text-muted text-xs whitespace-nowrap">{i.restored_at}</td>
                    <td className="text-body text-sm">{i.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

function fmtHrs(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}
