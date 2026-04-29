import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Link from 'next/link';

type Eol = {
  panel_slug: string;
  context: string;
  value_ohm: number;
  watts: number;
  polarity: string;
  spur_handling: string;
  note: string;
};

export const dynamic = 'force-static';

export default function EolPage() {
  const eols = JSON.parse(readFileSync(resolve(process.cwd(), 'data/eol.json'), 'utf8')) as Eol[];

  // Group by vendor inferred from panel_slug prefix
  const byVendor = new Map<string, Eol[]>();
  for (const e of eols) {
    const v = e.panel_slug.split('-')[0];
    if (!byVendor.has(v)) byVendor.set(v, []);
    byVendor.get(v)!.push(e);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">End-of-line resistor reference</h1>
        <p className="text-muted text-sm mt-1">
          Quick lookup of EOL value, polarity and spur-handling per panel. Always verify against the
          site as-built — installations sometimes deviate from the standard value, and an unexpected
          EOL throws zone-fault on every reset.
        </p>
      </header>

      {Array.from(byVendor.entries()).map(([vendor, list]) => (
        <section key={vendor} className="space-y-2">
          <h2 className="text-lg font-semibold text-head capitalize">{vendor}</h2>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Panel</th><th>Circuit</th><th>EOL</th><th>Polarity</th><th>Spurs</th></tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={`${e.panel_slug}:${e.context}`}>
                    <td className="text-head">
                      <Link href={`/panels/${e.panel_slug}`} className="no-underline hover:underline">{e.panel_slug}</Link>
                    </td>
                    <td className="text-body">{e.context}</td>
                    <td className="font-semibold text-head whitespace-nowrap">{e.value_ohm.toLocaleString()} Ω · {e.watts} W</td>
                    <td className="text-body text-sm">{e.polarity}</td>
                    <td className="text-body text-sm">{e.spur_handling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="text-sm text-muted">
            <summary className="cursor-pointer">Notes</summary>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              {list.map((e) => (
                <li key={`note-${e.panel_slug}:${e.context}`}>
                  <strong className="text-head">{e.panel_slug} — {e.context}:</strong> {e.note}
                </li>
              ))}
            </ul>
          </details>
        </section>
      ))}

      <div className="card p-4 text-sm text-muted">
        <strong className="text-head">Reading the EOL on a multimeter:</strong> measure across the
        far-end pair with the panel powered down (PSU isolated). A correct reading sits within
        ±5% of the rated value at 20 °C; drift beyond that suggests an aged or moisture-affected
        resistor.
      </div>
    </div>
  );
}
