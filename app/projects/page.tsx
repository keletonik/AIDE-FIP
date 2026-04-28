import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { batteryProjects } from '@/lib/projects';
import { sites } from '@/lib/sites';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Battery projects' };

export default async function ProjectsIndex() {
  const me = await currentUser();
  if (!me) redirect('/login');
  const list = batteryProjects.list();
  const siteMap = new Map(sites.list().map(s => [s.id, s.name]));
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-head">Battery projects</h1>
        {me.role !== 'viewer' && <Link href="/projects/new" className="btn btn-primary">+ New project</Link>}
      </div>

      {list.length === 0 ? (
        <div className="card p-6 text-muted">No projects yet. Use this for buildings with multiple FIPs sharing a backup design.</div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {list.map(p => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="card p-4 block no-underline hover:border-link">
                <div className="text-head font-semibold">{p.name}</div>
                <div className="text-sm text-muted mt-1">
                  {p.standby_hours} h standby · {p.alarm_minutes} min alarm · ageing ×{p.ageing_factor.toFixed(2)}
                </div>
                {p.site_id && <div className="text-xs text-muted mt-1">Site: {siteMap.get(p.site_id) ?? `#${p.site_id}`}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
