import Link from 'next/link';

const tools = [
  {
    href: '/battery',
    title: 'Battery sizing',
    blurb: 'Standby + alarm Ah for any panel, with ageing factor. Suggests next commercial size up.',
    refs: ['AS 1670.1 §3.16', 'AS 1851 §6.5'],
  },
  {
    href: '/loop-calc',
    title: 'Loop voltage drop',
    blurb: 'Worst-case voltage at the far device. Per-protocol budgets (Apollo, ESP, IDNet, LSN, OPAL, Pertronic, GST). Class A/B handling.',
    refs: ['Manufacturer SLC budgets'],
  },
  {
    href: '/spacing',
    title: 'Detector spacing',
    blurb: 'Smoke / heat / beam grid sizing. Square-grid pitch, count, edge offset, ceiling-height warnings.',
    refs: ['AS 1670.1 §3.2', '§3.5', '§3.6'],
  },
  {
    href: '/coverage',
    title: 'Sounder + strobe coverage',
    blurb: 'Sounder dB at distance with ambient sum. Strobe candela for room size. Ceiling Class C model.',
    refs: ['AS 1670.4 §3.3', 'AS 7240.23'],
  },
  {
    href: '/zone-check',
    title: 'Zone-area check',
    blurb: 'Total zone count for a building. Max 2000 m² (1000 m² sleeping risk), one per floor, plus mandatory splits.',
    refs: ['AS 1670.1 §4.3'],
  },
  {
    href: '/cables',
    title: 'Cable selector',
    blurb: 'FP200 (WS52W), MIMS / MICC, FR-SWA, FP200 Flex — what to use where, plus identification of non-fire-rated cable on retrofits.',
    refs: ['AS/NZS 3013', 'AS 1670.1 §7.3'],
  },
  {
    href: '/eol',
    title: 'EOL resistor reference',
    blurb: 'Per-panel EOL value, polarity, spur handling. Notes on reading the EOL on a multimeter.',
    refs: ['Per-panel manuals'],
  },
];

export const dynamic = 'force-static';

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-head">Field tools</h1>
        <p className="text-muted text-sm mt-1">
          Deterministic engineering tools. Each shows its working — the math is auditable, not magic.
          Engineering judgement still applies; the design engineer signs off on real systems.
        </p>
      </header>
      <ul className="grid sm:grid-cols-2 gap-3">
        {tools.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="card block p-4 no-underline hover:border-link h-full">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-head">{t.title}</h2>
                <span className="text-muted text-sm">→</span>
              </div>
              <p className="text-sm text-muted mt-1">{t.blurb}</p>
              <div className="mt-2 flex gap-1 flex-wrap">
                {t.refs.map((r) => <span key={r} className="tag text-[10px]">{r}</span>)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
