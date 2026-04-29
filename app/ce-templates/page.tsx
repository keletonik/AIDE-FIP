import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Rule = { zone: string; outputs: string[]; notes?: string };
type Template = {
  slug: string;
  name: string;
  building_class: string;
  summary: string;
  zones: string[];
  outputs: string[];
  rules: Rule[];
  as_refs: string[];
  notes: string;
};

export const dynamic = 'force-static';

export default function CETemplatesPage() {
  const templates = JSON.parse(readFileSync(resolve(process.cwd(), 'data/ce-templates.json'), 'utf8')) as Template[];

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">Cause-and-effect template library</h1>
        <p className="text-muted text-sm mt-1">
          Starting-point CBE patterns by building class. Use as a checklist when commissioning or
          reviewing an existing matrix — every site needs a fire-engineering review and witness test
          before going live.
        </p>
      </header>

      {templates.map((t) => (
        <article key={t.slug} className="card p-4 space-y-3">
          <header className="space-y-1">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-head">{t.name}</h2>
              <span className="tag">{t.building_class}</span>
            </div>
            <p className="text-body text-sm">{t.summary}</p>
          </header>

          <div className="grid sm:grid-cols-2 gap-3">
            <Block title="Zones">
              <ul className="text-sm space-y-1">
                {t.zones.map((z) => <li key={z}>· {z}</li>)}
              </ul>
            </Block>
            <Block title="Outputs">
              <ul className="text-sm space-y-1">
                {t.outputs.map((o) => <li key={o}>· {o}</li>)}
              </ul>
            </Block>
          </div>

          <Block title="Rules">
            <ul className="space-y-2">
              {t.rules.map((r, i) => (
                <li key={i} className="text-sm">
                  <div className="text-head font-semibold">{r.zone}</div>
                  <div className="text-body">→ {r.outputs.join(', ')}</div>
                  {r.notes && <div className="text-muted text-xs mt-0.5">{r.notes}</div>}
                </li>
              ))}
            </ul>
          </Block>

          <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted">
            <span className="text-muted">References:</span>
            {t.as_refs.map((r) => <span key={r} className="tag">{r}</span>)}
          </div>
          <p className="text-xs text-muted">{t.notes}</p>
        </article>
      ))}

      <div className="card p-4 text-sm text-muted">
        <strong className="text-head">Anti-feature note:</strong> these templates do NOT auto-program
        the panel. Cause-and-effect mistakes are life-safety. Use the template as a checklist;
        program through the panel&apos;s vendor tool (Pertronic PFS, Notifier VeriFire, Tyco Loop
        Explorer, Bosch FSP-5000-RPS, Vigilant T-Gen Tool) and witness-test every rule.
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line rounded-md p-3 bg-ink/40">
      <div className="text-xs uppercase tracking-wider text-muted mb-2">{title}</div>
      {children}
    </div>
  );
}
