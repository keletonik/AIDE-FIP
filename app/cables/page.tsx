import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Cable = {
  slug: string;
  name: string;
  category: string;
  fire_rating: string;
  ws_class: string;
  csa_mm2: number[];
  use_cases: string[];
  as_refs: string[];
  notes: string;
};

export const dynamic = 'force-static';

export default function CablesPage() {
  const cables = JSON.parse(readFileSync(resolve(process.cwd(), 'data/cables.json'), 'utf8')) as Cable[];

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">Cable selector</h1>
        <p className="text-muted text-sm mt-1">
          Match the right cable to a fire-system circuit. Always verify the specific construction's
          AS/NZS 3013 WS class and check segregation from non-fire services per AS 1670.1 §7.3.
        </p>
      </header>

      <div className="space-y-3">
        {cables.map((c) => (
          <article key={c.slug} className="card p-4 space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-head">{c.name}</h2>
              <span className={`tag ${c.category === 'general-electrical' ? 'tag-warn' : c.category.startsWith('fire-rated') ? 'tag-ok' : ''}`}>
                {c.category}
              </span>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <Pair k="Fire rating" v={c.fire_rating} />
              <Pair k="WS class" v={c.ws_class} />
              <Pair k="CSA available" v={c.csa_mm2.length ? c.csa_mm2.map(s => `${s} mm²`).join(', ') : '—'} />
              <Pair k="AS refs" v={c.as_refs.length ? c.as_refs.join(', ') : '—'} />
            </dl>
            <div>
              <div className="text-xs text-muted uppercase tracking-wider">Use cases</div>
              <ul className="list-disc pl-5 text-body text-sm space-y-0.5">
                {c.use_cases.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
            <p className="text-xs text-muted">{c.notes}</p>
          </article>
        ))}
      </div>

      <p className="text-xs text-muted">
        Cable certification is product-specific — always check the manufacturer&apos;s AS 3013 declaration
        for the exact construction, length and bundling configuration relevant to your install.
      </p>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted">{k}</dt>
      <dd className="text-body">{v}</dd>
    </>
  );
}
