'use client';

import { useMemo, useState } from 'react';
import { calculateLoop, COMMON_CABLES, PROTOCOL_BUDGETS, type LoopProtocol, type LoopClass } from '@/lib/loop';

export function LoopCalcClient() {
  const [protocol, setProtocol] = useState<LoopProtocol>('apollo-discovery');
  const [loopClass, setLoopClass] = useState<LoopClass>('A');
  const [length, setLength] = useState(800);
  const [cableIdx, setCableIdx] = useState(0);
  const [deviceCount, setDeviceCount] = useState(60);
  const [avgMa, setAvgMa] = useState(0.5);
  const [peakMa, setPeakMa] = useState(4.0);
  const [safety, setSafety] = useState(20);

  const cable = COMMON_CABLES[cableIdx];

  const result = useMemo(() => calculateLoop({
    protocol,
    loopClass,
    length_m: length,
    ohms_per_km: cable.ohms_per_km,
    device_count: deviceCount,
    avg_device_ma: avgMa,
    peak_device_ma: peakMa,
    safety_margin_pct: safety,
  }), [protocol, loopClass, length, cable, deviceCount, avgMa, peakMa, safety]);

  const statusCls =
    result.status === 'pass'  ? 'text-ok' :
    result.status === 'warn'  ? 'text-amber' :
                                 'text-warn';

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Loop calculator inputs">
        <Field id="lp-protocol" label="Protocol">
          <select id="lp-protocol" name="protocol" value={protocol} onChange={(e) => setProtocol(e.target.value as LoopProtocol)}>
            {PROTOCOL_BUDGETS.map((b) => (
              <option key={b.protocol} value={b.protocol}>
                {b.protocol} (V {b.v_supply}, floor {b.v_min_device}, max {b.max_devices})
              </option>
            ))}
          </select>
        </Field>
        <Field id="lp-class" label="Loop class">
          <select id="lp-class" name="loopClass" value={loopClass} onChange={(e) => setLoopClass(e.target.value as LoopClass)}>
            <option value="A">Class A (ring with redundancy)</option>
            <option value="B">Class B (radial / spur)</option>
          </select>
        </Field>
        <Field id="lp-length" label="Total cable length (m)">
          <input id="lp-length" name="length" type="number" inputMode="numeric"
            min={1} max={10000} value={length} onChange={(e) => setLength(parseInt(e.target.value) || 0)} />
        </Field>
        <Field id="lp-cable" label="Cable">
          <select id="lp-cable" name="cable" value={cableIdx} onChange={(e) => setCableIdx(parseInt(e.target.value, 10))}>
            {COMMON_CABLES.map((c, i) => (
              <option key={c.label} value={i}>{c.label} — {c.ohms_per_km} Ω/km</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="lp-devices" label="Device count">
            <input id="lp-devices" name="devices" type="number" inputMode="numeric"
              min={1} max={500} value={deviceCount} onChange={(e) => setDeviceCount(parseInt(e.target.value) || 0)} />
          </Field>
          <Field id="lp-safety" label="Safety margin (%)">
            <input id="lp-safety" name="safety" type="number" inputMode="numeric"
              min={0} max={100} value={safety} onChange={(e) => setSafety(parseInt(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="lp-avgma" label="Avg standby (mA/dev)">
            <input id="lp-avgma" name="avgMa" type="number" inputMode="decimal" step="0.1"
              min={0.1} max={50} value={avgMa} onChange={(e) => setAvgMa(parseFloat(e.target.value) || 0)} />
          </Field>
          <Field id="lp-peakma" label="Peak alarm (mA/dev)">
            <input id="lp-peakma" name="peakMa" type="number" inputMode="decimal" step="0.5"
              min={0.5} max={500} value={peakMa} onChange={(e) => setPeakMa(parseFloat(e.target.value) || 0)} />
          </Field>
        </div>
        <p className="text-xs text-muted">
          Worst-case for Class A is half the loop length (the supply pushes from each end after a single break).
        </p>
      </form>

      <div className="card p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-head">Result</h2>
          <span className={`tag ${result.status === 'pass' ? 'tag-ok' : result.status === 'warn' ? 'tag-amber' : 'tag-warn'}`}>
            {result.status.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Big label="Vend (alarm)" value={`${result.v_end_alarm.toFixed(2)} V`} accent={result.status !== 'fail'} />
          <Big label="Headroom" value={`${result.headroom_v >= 0 ? '+' : ''}${result.headroom_v.toFixed(2)} V`} />
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
        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <p key={i} className={`text-sm ${statusCls}`}>⚠ {w}</p>
            ))}
          </div>
        )}
        <p className="text-xs text-muted">
          Reality-check: long retrofit runs should be measured at commissioning with a calibrated DMM
          while the loop is in alarm. Cable resistance rises ~0.4%/°C above 20 °C — derate in hot ceiling voids.
        </p>
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
