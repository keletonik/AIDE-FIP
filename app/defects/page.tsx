import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { defects } from '@/lib/defects';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Open defects' };

export default async function DefectsIndex() {
  const me = await currentUser();
  if (!me) redirect('/login');
  const list = defects.open();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-head">Open defects</h1>
      {list.length === 0 ? (
        <div className="card p-6 text-muted">Nothing open. Inbox zero, for once.</div>
      ) : (
        <table>
          <thead><tr><th>Site</th><th>Severity</th><th>Description</th><th>Status</th><th>Raised</th></tr></thead>
          <tbody>
            {list.map(d => (
              <tr key={d.id}>
                <td className="text-head"><Link className="no-underline hover:underline" href={`/sites/${d.site_id}`}>{d.site_name}</Link></td>
                <td>{d.severity}</td>
                <td className="text-body"><Link className="no-underline hover:underline" href={`/sites/${d.site_id}/defects/${d.id}`}>{d.description}</Link></td>
                <td>{d.status.replace('_', ' ')}</td>
                <td className="text-muted text-xs">{d.raised_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
