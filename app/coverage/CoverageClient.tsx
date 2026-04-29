'use client';

import { useMemo, useState } from 'react';
import { calculateSounder, calculateStrobe, type StrobeMount } from '@/lib/coverage';

export function CoverageClient() {
  // Sounder
  const [src, setSrc] = useState(95);
  const [dist, setDist] = useState(8);
  const [ambient, setAmbient] = useState(45);
  const [target, setTarget] = useState(65);

  // Strobe
  const [mount, setMount] = useState<StrobeMount>('ceiling-c');
  const [side, setSide] = useState(12);
  const [ceiling, setCeiling] = useState(2.7);

  const sounder = useMemo(() => calculateSounder({
    source_db_at_1m: src, distance_m: dist, ambient_db: ambient, target_db: target,
  }), [src, dist, ambient, target]);

  const strobe = useMemo(() => calculateStrobe({
    mount, room_side_m: side, ceiling_m: ceiling,
  }), [mount, side, ceiling]);

  return (
    <div className="space-y-8">
      <section className="grid md:grid-cols-2 gap-6">
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Sounder inputs">
          <h2 className="text-lg font-semibold text-head">Sounder dB at distance</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field id="sn-src" label="Source SPL @ 1 m (dB)">
              <input id="sn-src" name="src" type="number" inputMode="decimal" step="0.5"
                min={50} max={130} value={src} onChange={(e) => setSrc(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field id="sn-dist" label="Distance to listener (m)">
              <input id="sn-dist" name="dist" type="number" inputMode="decimal" step="0.5"
                min={0.1} max={200} value={dist} onChange={(e) => setDist(parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="sn-amb" label="Ambient noise (dB)">
              <input id="sn-amb" name="ambient" type="number" inputMode="decimal" step="0.5"
                min={20} max={100} value={ambient} onChange={(e) => setAmbient(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field id="sn-tgt" label="Target SPL (dB)">
              <input id="sn-tgt" name="target" type="number" inputMode="decimal" step="0.5"
                min={30} max={110} value={target} onChange={(e) => setTarget(parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
          <p className="text-xs text-muted">
            AS 1670.1 §3.22 typical targets: 65 dB(A) general, 75 dB(A) at bedhead, or 15 dB above ambient — whichever is higher.
          </p>
        </form>
        <div className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-head">Sounder result</h3>
            <span className={`tag ${sounder.status === 'pass' ? 'tag-ok' : sounder.status === 'warn' ? 'tag-amber' : 'tag-warn'}`}>
              {sounder.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Big label="At listener" value={`${sounder.spl_combined.toFixed(1)} dB`} accent={sounder.status !== 'fail'} />
            <Big label="Headroom" value={`${sounder.headroom_db >= 0 ? '+' : ''}${sounder.headroom_db.toFixed(1)} dB`} />
          </div>
          <table>
            <tbody>
              {sounder.workings.map((w, i) => (
                <tr key={i}><td className="text-muted">{w.label}</td><td className="text-body">{w.value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Strobe inputs">
          <h2 className="text-lg font-semibold text-head">Strobe candela coverage</h2>
          <Field id="st-mount" label="Mount type">
            <select id="st-mount" name="mount" value={mount} onChange={(e) => setMount(e.target.value as StrobeMount)}>
              <option value="ceiling-c">Ceiling (Class C)</option>
              <option value="wall-w">Wall (Class W) — see standard</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="st-side" label="Room longest side (m)">
              <input id="st-side" name="side" type="number" inputMode="decimal" step="0.5"
                min={1} max={50} value={side} onChange={(e) => setSide(parseFloat(e.target.value) || 0)} />
            </Field>
            <Field id="st-ceil" label="Ceiling height (m)">
              <input id="st-ceil" name="ceiling" type="number" inputMode="decimal" step="0.1"
                min={1} max={10} value={ceiling} onChange={(e) => setCeiling(parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
          <p className="text-xs text-muted">
            AS 7240.23 / NFPA 72 model. Square ceiling-mount Class C, ceiling ≤ 3 m.
          </p>
        </form>
        <div className="card p-4 space-y-3">
          <h3 className="text-lg font-semibold text-head">Strobe result</h3>
          <div className="grid grid-cols-2 gap-2">
            <Big label="Required" value={`${strobe.required_cd} cd`} />
            <Big label="Fit" value={`${strobe.fit_cd} cd`} accent />
          </div>
          <p className="text-sm text-body">{strobe.notes}</p>
          {strobe.warnings.length > 0 && (
            <div className="space-y-1">
              {strobe.warnings.map((w, i) => <p key={i} className="text-sm text-amber">⚠ {w}</p>)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
function Big({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-md border ${accent ? 'border-link' : 'border-line'}`}>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`text-2xl font-semibold ${accent ? 'text-link' : 'text-head'}`}>{value}</div>
    </div>
  );
}
