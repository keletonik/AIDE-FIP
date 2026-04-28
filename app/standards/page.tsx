import Link from 'next/link';
import { standards } from '@/lib/repos';

export const metadata = { title: 'Standards' };
export const dynamic = 'force-dynamic';

export default function StandardsIndex() {
  const list = standards.list();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-head">Standards</h1>
      <p className="text-muted text-sm">Paraphrased headlines for the standards techs reach for in NSW. Click through for clauses and a link to the knowledge base for the full text.</p>

      <ul className="space-y-2">
        {list.map(s => (
          <li key={s.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <Link href={`/standards/${s.id}`} className="text-head text-lg font-semibold no-underline hover:underline">
                {s.title}
              </Link>
              <span className="tag">{s.year ?? '—'}</span>
            </div>
            {s.summary && <p className="text-sm text-body mt-2">{s.summary}</p>}
            <div className="text-xs text-muted mt-2">{s.authority}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
