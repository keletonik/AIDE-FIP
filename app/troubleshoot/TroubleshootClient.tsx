'use client';

import { useEffect, useMemo, useState } from 'react';

type Symptom = { slug: string; title: string; panel_filter: string | null };
type Cause = { id: number; cause: string; remediation: string; rank: number };

export function TroubleshootClient({ initialSymptoms }: { initialSymptoms: Symptom[] }) {
  const [q, setQ] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSymptoms[0]?.slug ?? null);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return initialSymptoms;
    return initialSymptoms.filter(s => s.title.toLowerCase().includes(term));
  }, [q, initialSymptoms]);

  useEffect(() => {
    if (!activeSlug) { setCauses([]); return; }
    let cancelled = false;
    setPending(true);
    fetch(`/api/troubleshoot?slug=${encodeURIComponent(activeSlug)}`)
      .then(r => r.json())
      .then((data: { causes: Cause[] }) => { if (!cancelled) setCauses(data.causes); })
      .catch(() => { if (!cancelled) setCauses([]); })
      .finally(() => { if (!cancelled) setPending(false); });
    return () => { cancelled = true; };
  }, [activeSlug]);

  const active = filtered.find(s => s.slug === activeSlug) ?? initialSymptoms.find(s => s.slug === activeSlug);

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <aside className="space-y-2">
        <input
          placeholder="Search symptoms…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="space-y-1">
          {filtered.map(s => (
            <li key={s.slug}>
              <button
                onClick={() => setActiveSlug(s.slug)}
                className={`w-full text-left px-3 py-2 rounded-md ${activeSlug === s.slug ? 'bg-line text-head' : 'text-body hover:bg-line/60'}`}
              >
                {s.title}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="text-muted text-sm px-3 py-2">No matches.</li>}
        </ul>
      </aside>

      <section className="card p-4 space-y-3">
        {active ? (
          <>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-head">{active.title}</h2>
              {pending && <span className="text-xs text-muted">loading…</span>}
            </div>
            {causes.length === 0 && !pending && <p className="text-muted text-sm">No causes recorded yet.</p>}
            <ol className="space-y-3">
              {causes.map((c, i) => (
                <li key={c.id} className="border border-line rounded-md p-3">
                  <div className="flex items-baseline gap-3">
                    <span className="tag tag-amber">#{i + 1}</span>
                    <strong className="text-head">{c.cause}</strong>
                  </div>
                  <p className="text-body text-sm mt-2">{c.remediation}</p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-muted text-sm">Pick a symptom from the list.</p>
        )}
      </section>
    </div>
  );
}
