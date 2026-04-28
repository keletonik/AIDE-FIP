import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { defects } from '@/lib/defects';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sites' };

export default async function SitesIndex() {
  const me = await currentUser();
  if (!me) redirect('/login');

  const list = sites.list();
  const openCounts = new Map<number, number>();
  for (const r of all<{ site_id: number; c: number }>(`SELECT site_id, COUNT(*) c FROM defects WHERE status != 'resolved' GROUP BY site_id`)) {
    openCounts.set(r.site_id, r.c);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-head">Sites</h1>
        {(me.role === 'admin' || me.role === 'tech') &&
          <Link href="/sites/new" className="btn btn-primary">+ Add site</Link>}
      </div>
      {list.length === 0 ? (
        <div className="card p-6 text-muted">No sites yet. Add one to start logging defects, services and brigade tests.</div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {list.map(s => (
            <li key={s.id}>
              <Link href={`/sites/${s.id}`} className="card p-4 block no-underline hover:border-link">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-head font-semibold">{s.name}</span>
                  {(openCounts.get(s.id) ?? 0) > 0 && <span className="tag tag-warn">{openCounts.get(s.id)} open</span>}
                </div>
                <div className="text-sm text-muted mt-1">{[s.address, s.suburb, s.postcode].filter(Boolean).join(' · ')}</div>
                {s.contact_name && <div className="text-xs text-muted mt-2">Contact: {s.contact_name}{s.contact_phone ? ` · ${s.contact_phone}` : ''}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
