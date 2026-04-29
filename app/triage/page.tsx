import Link from 'next/link';
import { all } from '@/lib/db';
import { audit } from '@/lib/audit';

type Symptom = { slug: string; title: string; cause_count: number };
type Cause = { rank: number; cause: string; remediation: string };

export const dynamic = 'force-dynamic';

export default async function TriagePage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams;
  const slug = sp.s ?? null;

  await audit({ action: 'triage.view', target: slug ?? '' });

  const symptoms = all<Symptom>(`
    SELECT s.slug, s.title, (SELECT COUNT(*) FROM symptom_causes WHERE symptom_slug = s.slug) AS cause_count
    FROM symptoms s ORDER BY s.title
  `);

  const causes = slug
    ? all<Cause>(`SELECT rank, cause, remediation FROM symptom_causes WHERE symptom_slug = ? ORDER BY rank`, [slug])
    : [];
  const symptomTitle = slug ? symptoms.find(s => s.slug === slug)?.title : null;

  return (
    <div className="triage-mode space-y-6">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-head">Triage</h1>
          <span className="text-sm text-muted">After-hours mode</span>
        </div>
        <p className="text-muted text-sm">
          Big-button view for on-call work. Pick the symptom you see at the panel; get top causes
          and remediation. Nothing here calls brigade — that&apos;s a human decision.
        </p>
      </header>

      {!slug && (
        <section className="space-y-2">
          <h2 className="text-base text-muted uppercase tracking-wide">What is the panel showing?</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {symptoms.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/triage?s=${s.slug}`}
                  className="card block p-4 no-underline hover:border-link min-h-[64px]"
                >
                  <div className="text-head text-lg font-semibold">{s.title}</div>
                  <div className="text-muted text-xs mt-1">{s.cause_count} cause{s.cause_count === 1 ? '' : 's'}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {slug && (
        <section className="space-y-3">
          <Link href="/triage" className="text-sm text-muted no-underline">← back</Link>
          <h2 className="text-2xl font-bold text-head">{symptomTitle}</h2>
          <ol className="space-y-3">
            {causes.map((c) => (
              <li key={c.rank} className="card p-4 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="tag tag-amber text-base">#{c.rank}</span>
                  <span className="text-head text-lg font-semibold">{c.cause}</span>
                </div>
                <p className="text-body">{c.remediation}</p>
              </li>
            ))}
          </ol>
          <div className="card p-4 text-sm text-muted">
            <strong className="text-head">Before you act:</strong> if you have any doubt about the
            building's occupancy or the validity of the alarm, do not silence or reset until you've
            spoken to the building manager. The brigade is already responding once the ASE has signalled.
          </div>
        </section>
      )}
    </div>
  );
}
