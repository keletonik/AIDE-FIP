import Link from 'next/link';
import { currentUser } from '@/lib/auth';

const referenceTiles = [
  { href: '/standards',    title: 'Standards',     blurb: 'AS 1670 family, AS 1851 service, AS 4428.16 EWIS, AS 7240, AS 1735.11 lifts, AS 1668.1 HVAC. Paraphrased clauses, deep KB link-outs.' },
  { href: '/panels',       title: 'Panels',        blurb: '23 panels: Pertronic, Vigilant FP/MX1/T-Gen, Ampac, Notifier ID3000/NFS2-3030, Simplex, EST3, Tyco MX/F3200, Bosch, Hochiki, Mircom, Ziton, GST, Inim, Morley.' },
  { href: '/battery',      title: 'Battery calc',  blurb: '24 h standby + 30 min alarm by default, with ageing factor. Suggests next commercial size up.' },
  { href: '/loop-calc',    title: 'Loop V-drop',   blurb: 'Worst-case voltage at the far device. Per-protocol budgets (Apollo, ESP, IDNet, LSN, Pertronic, OPAL).' },
  { href: '/spacing',      title: 'Detector spacing', blurb: 'AS 1670.1 §3.2/§3.5/§3.6 grid sizing — point smoke, point heat, beam smoke. Flat-ceiling sanity check.' },
  { href: '/cables',       title: 'Cable selector', blurb: 'FP200 (WS52W), MIMS, FR-SWA — what to use where, AS 3013 / AS 1670.1 §7.3 references.' },
  { href: '/troubleshoot', title: 'Troubleshoot',  blurb: '25 symptoms covering earth faults, ASE, EWIS, lift recall, AHU shutdown, VESDA, intermittents and more.' },
];
const workflowTiles = [
  { href: '/sites',        title: 'Sites',         blurb: 'Per-site panel register, defects, AS 1851 service records, brigade tests, cause-and-effect.' },
  { href: '/defects',      title: 'Open defects',  blurb: 'Cross-site queue ranked by severity.' },
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
