import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isolations, hoursSince } from '@/lib/isolations';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function IsolationsPage() {
  const me = await currentUser();
  if (!me) redirect('/login');
  await audit({ action: 'isolations.view' });

  const active = isolations.allActive();

  return (
    <article className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-head">Active isolations</h1>
        <p className="text-muted text-sm">
          Anything disabled at any panel that has not yet been restored. Critical: no isolation should
          be left open when you leave site. Filter or sort below.
        </p>
      </header>

      {active.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-head">Nothing currently isolated. ✓</p>
          <p className="text-muted text-sm mt-1">All sites clean.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Scope</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Since</th>
                <th>Expected restore</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map((i) => {
                const hrs = hoursSince(i.isolated_at);
                const overdue = hrs > 24;
                const veryOverdue = hrs > 72;
                return (
                  <tr key={i.id} className={veryOverdue ? 'bg-warn/10' : overdue ? 'bg-amber/10' : ''}>
                    <td className="text-head">
                      <Link href={`/sites/${i.site_id}/isolations`} className="no-underline hover:underline">{i.site_name}</Link>
                    </td>
                    <td><span className="tag">{i.scope}</span></td>
                    <td className="text-head">{i.target}</td>
                    <td className="text-body text-sm">{i.reason}</td>
                    <td className={veryOverdue ? 'text-warn' : overdue ? 'text-amber' : 'text-muted'}>
                      {fmtHrs(hrs)}
                    </td>
                    <td className="text-muted text-sm">{i.expected_restore_at ?? '—'}</td>
                    <td>
                      <Link className="btn" href={`/sites/${i.site_id}/isolations`}>Manage →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-4 text-sm text-muted">
        <strong className="text-head">Why this matters:</strong> AS 1670.1 requires the panel to indicate
        active isolations. The most-overlooked failure mode in service work is leaving site with a
        zone still disabled — the alarm path is broken until you return. This dashboard is the
        last line of defence before you walk out.
      </div>
    </article>
  );
}

function fmtHrs(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}
