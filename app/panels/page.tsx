import Link from 'next/link';
import { panels } from '@/lib/repos';

export const metadata = { title: 'Panels' };
export const dynamic = 'force-dynamic';

export default function PanelsIndex() {
  const list = panels.list();

  // Group by vendor for the sidebar feel.
  const byVendor: Record<string, typeof list> = {};
  for (const p of list) (byVendor[p.vendor] ??= []).push(p);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Panels</h1>
      <p className="text-muted text-sm">Day-mode keystrokes and engineer menu paths for the FIPs you'll meet on the job. Battery loads from each panel's manual seed the calculator.</p>

      {Object.entries(byVendor).map(([vendor, ps]) => (
        <section key={vendor} className="space-y-2">
          <h2 className="text-sm uppercase tracking-wide text-muted">{vendor}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {ps.map(p => (
              <li key={p.slug}>
                <Link href={`/panels/${p.slug}`} className="card p-4 block no-underline hover:border-link">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-head font-semibold">{p.name}</span>
                    {p.loops_max != null && <span className="tag">{p.loops_max} loop{p.loops_max === 1 ? '' : 's'}</span>}
                  </div>
                  {p.notes && <p className="text-sm text-muted mt-1">{p.notes}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
