import Link from 'next/link';
import { currentUser } from '@/lib/auth';

const referenceTiles = [
  { href: '/triage',       title: 'Triage',        blurb: 'After-hours mode. Big-button view: pick the symptom you see at the panel; get top causes + remediation. Built for one-handed use at 2 am.' },
  { href: '/standards',    title: 'Standards',     blurb: '13 standards: AS 1670 family, AS 1851 service, AS 4428.16 EWIS, AS 7240, AS 1735.11 lifts, AS 1668.1 HVAC, AS/NZS 3013. Paraphrased + KB link-outs.' },
  { href: '/panels',       title: 'Panels',        blurb: '22 panels: Pertronic F100/F120/F16e, Vigilant FP/MX1/T-Gen, Ampac, Notifier ID3000/NFS2-3030, Simplex, EST3, Tyco MX/F3200, Bosch, Hochiki, Mircom, Ziton, GST, Inim, Morley.' },
  { href: '/tools',        title: 'Field tools',   blurb: 'Battery, loop V-drop, detector spacing, sounder/strobe coverage, zone-area check, cable selector, EOL reference. All deterministic, all show their working.' },
  { href: '/ce-templates', title: 'C&E templates', blurb: 'Cause-and-effect starting points by building class — Class 5 office, 9a hospital, 7a car park, 2 residential, 9b school, 8 warehouse.' },
  { href: '/troubleshoot', title: 'Troubleshoot',  blurb: '25 symptoms / 80 ranked causes covering earth faults, ASE, EWIS, lift recall, AHU shutdown, VESDA, sprinkler flow, intermittents.' },
];
const workflowTiles = [
  { href: '/sites',        title: 'Sites',         blurb: 'Per-site panel register, defects, AS 1851 service records, brigade tests, cause-and-effect.' },
  { href: '/defects',      title: 'Open defects',  blurb: 'Cross-site queue ranked by severity.' },
  { href: '/isolations',   title: 'Active isolations', blurb: 'Anything disabled at any panel that has not been restored. The last line of defence before you walk out of site.' },
  { href: '/projects',     title: 'Battery projects', blurb: 'Multi-panel battery sizing for buildings with more than one FIP.' },
];

export const dynamic = 'force-dynamic';

export default async function Home() {
  const me = await currentUser();
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-head">Field reference for fire indicator panel work.</h1>
        <p className="text-body max-w-2xl">
          Built for techs at the panel: cold cupboard, one bar of 4G, gloves on. Everything here is fast to find,
          big enough to tap, and works offline once you've loaded it once.
        </p>
      </section>

      {me && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Workflow</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {workflowTiles.map(t => <Tile key={t.href} {...t} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Reference</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {referenceTiles.map(t => <Tile key={t.href} {...t} />)}
        </div>
      </section>

      {!me && (
        <section className="card p-4 text-sm text-muted">
          <strong className="text-head">Sign in</strong> to manage sites, log defects with photos, run AS 1851
          services, edit cause-and-effect matrices and roll up battery sizing across multiple FIPs.
        </section>
      )}

      <section className="card p-4 text-sm text-muted">
        <strong className="text-head">Note.</strong> AS standards are copyright Standards Australia and panel
        manuals are copyright the manufacturer. AIDE-FIP paraphrases enough to find things on site and links
        out to authoritative sources for the verbatim text.
      </section>
    </div>
  );
}

function Tile({ href, title, blurb }: { href: string; title: string; blurb: string }) {
  return (
    <Link href={href} className="card p-4 no-underline hover:border-link transition-colors">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold text-head">{title}</h3>
        <span className="text-muted text-sm">→</span>
      </div>
      <p className="text-sm text-muted mt-1">{blurb}</p>
    </Link>
  );
}
