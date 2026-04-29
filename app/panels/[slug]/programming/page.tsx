import Link from 'next/link';
import { notFound } from 'next/navigation';
import { panels } from '@/lib/repos';
import { kb } from '@/lib/kb';

// Programming-sequences scaffold. By design, this page does NOT paraphrase
// vendor keystroke sequences (firmware-version-specific, vendor IP). Instead
// it lays out the standard tasks every tech needs and links to the vendor
// manual on the knowledge-base for each one.

const TASKS: { id: string; label: string; what_to_look_for: string }[] = [
  { id: 'engineer-mode',  label: 'Enter engineer mode',                what_to_look_for: 'Look for "Engineer", "Service" or "Level 3/4" in the panel menu. Codes vary; check the site logbook before requesting a vendor reset.' },
  { id: 'walk-test',      label: 'Run a walk test (AS 1851 §6.4)',     what_to_look_for: 'Look for "Walk Test", "One Man Test" or "Test Mode". Some panels require a zone or device list to be selected first; outputs are normally inhibited during test.' },
  { id: 'address-device', label: 'Address / re-address a device',      what_to_look_for: 'Use the panel programming tool (e.g. Loop Explorer for MX, VeriFire for Notifier, PFS for Pertronic). Manual address dipswitches on older devices.' },
  { id: 'isolate-point',  label: 'Isolate a device or zone',           what_to_look_for: 'Look for "Disable" / "Isolate" / "Block". Always log the isolation; AS 1670.1 §3.22 requires the panel to indicate the isolation state. Reverse before leaving site.' },
  { id: 'force-output',   label: 'Force a brigade / output relay',     what_to_look_for: 'Engineer-only. Used for verifying ASE / lift / AHU response. Typically under "Test → Output" or "Force". Coordinate with monitoring centre and document.' },
  { id: 'cause-effect',   label: 'View / edit cause-and-effect (CBE)',  what_to_look_for: 'Most modern panels are PC-tool-only for editing (Notifier VeriFire, Pertronic PFS, Tyco Loop Explorer, Bosch FSP-5000-RPS, Vigilant T-Gen Tool). Panel front allows VIEW only.' },
  { id: 'firmware-version', label: 'Show firmware / build version',    what_to_look_for: 'Usually under "Diagnostics → Version" or "About". Record this before any vendor escalation.' },
  { id: 'event-log',      label: 'Print or export the event log',      what_to_look_for: 'Required for AS 1851 routine service evidence. Most panels offer print to local USB or save-to-file via PC tool.' },
  { id: 'soft-reset',     label: 'Soft reset / reboot the panel',      what_to_look_for: 'Different from "Reset alarm". Soft reset clears volatile state; some panels need a power cycle to clear deeper faults.' },
  { id: 'day-night',      label: 'Day / night sensitivity profile',    what_to_look_for: 'Look for "Day/Night", "Sensitivity Schedule" or "Time Zones". Verify the panel time-of-day clock is accurate before changing the profile.' },
  { id: 'network-id',     label: 'Network / sub-panel addressing',     what_to_look_for: 'PNet (Pertronic), ES Net (Simplex), TLI (MX1), CIP (Notifier), CAN (Bosch). Address conflicts are the most common cause of network comm-fail.' },
  { id: 'ase-config',     label: 'ASE / brigade signalling configuration', what_to_look_for: 'ASE category (7500, ALCAM, FRIM-NET, Multitone) selected at the ASE box, not the panel. Coordinate with monitoring centre on poll interval and account ID.' },
];

export default async function PanelProgrammingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const panel = panels.get(slug);
  if (!panel) notFound();

  const kbBase = panel.kb_slug ? `${kb.panel(panel.kb_slug)}/programming` : null;

  return (
    <article className="space-y-6 max-w-4xl">
      <Link href={`/panels/${slug}`} className="text-sm text-muted no-underline">← {panel.name}</Link>

      <header>
        <h1 className="text-2xl font-bold text-head">{panel.name} — programming reference</h1>
        <p className="text-muted text-sm mt-1">
          {panel.vendor} · {panel.family ?? '—'} · {panel.loops_max ?? 0} loops max
        </p>
      </header>

      <div className="card p-4 space-y-1 text-sm">
        <p className="text-body">
          <strong className="text-head">Why this page links out instead of paraphrasing keystrokes:</strong>{' '}
          panel keystroke sequences are vendor IP and firmware-version-specific. Wrong info here
          could disable a system or void warranty. The knowledge-base mirrors the official manual.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-head">Common tasks</h2>
        <p className="text-muted text-sm">
          For each task below: what the feature is usually called on this class of panel, and a
          link to the vendor reference if available.
        </p>
        <ul className="space-y-3">
          {TASKS.map((t) => (
            <li key={t.id} className="card p-3 space-y-1">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-semibold text-head">{t.label}</h3>
                {kbBase && (
                  <a className="btn text-sm" href={`${kbBase}/${t.id}`} target="_blank" rel="noreferrer">
                    Vendor manual ↗
                  </a>
                )}
              </div>
              <p className="text-sm text-body">{t.what_to_look_for}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted">
        Engineering judgement still applies. After any programming change, run the affected
        cause-and-effect rules and witness with the building manager or a second tech.
      </p>
    </article>
  );
}
