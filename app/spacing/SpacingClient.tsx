'use client';

import { useMemo, useState } from 'react';
import { calculateSpacing, type DetectorType } from '@/lib/spacing';

export function SpacingClient() {
  const [type, setType] = useState<DetectorType>('smoke-point');
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(15);
  const [ceiling, setCeiling] = useState(3.0);

  const result = useMemo(() => calculateSpacing({
    type, length_m: length, width_m: width, ceiling_m: ceiling,
  }), [type, length, width, ceiling]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Spacing inputs">
        <Field id="sp-type" label="Detector type">
          <select id="sp-type" name="type" value={type} onChange={(e) => setType(e.target.value as DetectorType)}>
            <option value="smoke-point">Smoke point detector</option>
            <option value="heat-point">Heat point detector</option>
            <option value="beam-smoke">Beam smoke detector</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="sp-length" label="Room length (m)">
            <input id="sp-length" name="length" type="number" inputMode="decimal" step="0.5"
              min={1} max={200} value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)} />
          </Field>
          <Field id="sp-width" label="Room width (m)">
            <input id="sp-width" name="width" type="number" inputMode="decimal" step="0.5"
              min={1} max={200} value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} />
          </Field>
        </div>
        <Field id="sp-ceiling" label="Ceiling height (m)">
          <input id="sp-ceiling" name="ceiling" type="number" inputMode="decimal" step="0.1"
            min={1} max={50} value={ceiling} onChange={(e) => setCeiling(parseFloat(e.target.value) || 0)} />
        </Field>
        <p className="text-xs text-muted">
          Coverage is per detector. Add allowance for partitions, beam pockets, and HVAC supply diffusers.
          Pitched ceilings: install at apex; AS 1670.1 §3.2 reduces coverage with increasing pitch.
        </p>
      </form>

      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold text-head">Result</h2>
        <div className="grid grid-cols-2 gap-2">
          <Big label="Detectors" value={`${result.count}`} accent />
          <Big label="Grid" value={`${result.cols} × ${result.rows}`} />
        </div>
        <table>
          <tbody>
            {result.workings.map((w, i) => (
              <tr key={i}>
                <td className="text-muted">{w.label}</td>
                <td className="text-body">{w.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-body">{result.spec.notes}</p>
        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber">⚠ {w}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block space-y-1">
      <span className="block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-md border ${accent ? 'border-link' : 'border-line'}`}>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`text-2xl font-semibold ${accent ? 'text-link' : 'text-head'}`}>{value}</div>
    </div>
  );
}
