import Link from 'next/link';

const tiles = [
  { href: '/standards',    title: 'Standards',     blurb: 'AS 1670 family, AS 1851 service, AS 3745 emergency planning. Paraphrased clauses; deep links into the knowledge base.' },
  { href: '/panels',       title: 'Panels',        blurb: 'Pertronic, Ampac, Notifier, Simplex, Vigilant MX1, Bosch, Hochiki, Tyco. Day-mode and engineer keystrokes.' },
  { href: '/battery',      title: 'Battery calc',  blurb: '24 h standby + 30 min alarm by default, with ageing factor. Suggests next commercial size up.' },
  { href: '/troubleshoot', title: 'Troubleshoot',  blurb: 'Symptom → ranked causes → remediation. Earth faults, charger faults, ASE faults, intermittents.' },
  { href: '/products',     title: 'Products',      blurb: 'Normalised category vocabulary for product selection. Wires up to Flaro in V2.' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-head">Field reference for fire indicator panel work.</h1>
        <p className="text-body max-w-2xl">
          Built for techs at the panel: cold cupboard, one bar of 4G, gloves on. Everything here is fast to find,
          big enough to tap, and works offline once you've loaded it once.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        {tiles.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className="card p-4 no-underline hover:border-link transition-colors"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-head">{t.title}</h2>
              <span className="text-muted text-sm">→</span>
            </div>
            <p className="text-sm text-muted mt-1">{t.blurb}</p>
          </Link>
        ))}
      </section>

      <section className="card p-4 text-sm text-muted">
        <strong className="text-head">Note.</strong> AS standards are copyright Standards Australia and panel
        manuals are copyright the manufacturer. AIDE-FIP paraphrases enough to find things on site and links
        out to authoritative sources for the verbatim text.
      </section>
    </div>
  );
}
