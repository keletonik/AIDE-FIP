'use client';

import { useEffect, useMemo, useState } from 'react';

type Panel = { slug: string; name: string; vendor: string };
type Workings = { label: string; value: string }[];
type Result = {
  panelSlug: string;
  standbyMa: number; alarmMa: number;
  standbyHours: number; alarmMinutes: number;
  ageingFactor: number;
  requiredAh: number; suggestedAh: number;
  workings: Workings;
};

export function BatteryForm({ panels, initial }: { panels: Panel[]; initial?: string }) {
  const [panelSlug, setPanelSlug] = useState(initial ?? panels[0]?.slug ?? '');
  const [standbyHours, setStandbyHours] = useState(24);
  const [alarmMinutes, setAlarmMinutes] = useState(30);
  const [extraStandbyMa, setExtraStandbyMa] = useState(0);
  const [extraAlarmMa, setExtraAlarmMa] = useState(0);
  const [ageingFactor, setAgeingFactor] = useState(1.25);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedPanels = useMemo(() => {
    const out: Record<string, Panel[]> = {};
    for (const p of panels) (out[p.vendor] ??= []).push(p);
    return out;
  }, [panels]);

  useEffect(() => {
    let cancelled = false;
    async function calc() {
      setPending(true); setError(null);
      try {
        const r = await fetch('/api/battery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            panelSlug, standbyHours, alarmMinutes, extraStandbyMa, extraAlarmMa, ageingFactor,
          }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as Result;
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown error');
      } finally {
        if (!cancelled) setPending(false);
      }
    }
    if (panelSlug) calc();
    return () => { cancelled = true; };
  }, [panelSlug, standbyHours, alarmMinutes, extraStandbyMa, extraAlarmMa, ageingFactor]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Field label="Panel">
          <select value={panelSlug} onChange={(e) => setPanelSlug(e.target.value)}>
            {Object.entries(groupedPanels).map(([vendor, ps]) => (
              <optgroup key={vendor} label={vendor}>
                {ps.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Pair>
          <Field label="Standby hours"><NumberInput value={standbyHours} onChange={setStandbyHours} min={1} max={72} /></Field>
          <Field label="Alarm minutes"><NumberInput value={alarmMinutes} onChange={setAlarmMinutes} min={5} max={240} /></Field>
        </Pair>
        <Pair>
          <Field label="Extra standby (mA)"><NumberInput value={extraStandbyMa} onChange={setExtraStandbyMa} min={0} max={5000} /></Field>
          <Field label="Extra alarm (mA)"><NumberInput value={extraAlarmMa} onChange={setExtraAlarmMa} min={0} max={20000} /></Field>
        </Pair>
        <Field label={`Ageing factor (${ageingFactor.toFixed(2)})`}>
          <input
            type="range" min={1} max={2} step={0.05}
            value={ageingFactor}
            onChange={(e) => setAgeingFactor(parseFloat(e.target.value))}
          />
        </Field>
        <p className="text-xs text-muted">Common values: 1.25 for new install with quality batteries, 1.5 for difficult environment / older bank tolerance.</p>
      </form>

      <div className="card p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-head">Result</h2>
          {pending && <span className="text-xs text-muted">calculating…</span>}
        </div>
        {error && <p className="text-warn text-sm">Error: {error}</p>}
        {result && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Big label="Required" value={`${result.requiredAh.toFixed(1)} Ah`} />
              <Big label="Fit" value={`${result.suggestedAh} Ah`} accent />
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
            <p className="text-xs text-muted">
              Engineering judgement still applies. Verify the as-installed panel loads, derate for cabinet
              temperature, and confirm AS 1670.1 standby duration for the building class.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
function Pair({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function NumberInput({ value, onChange, min, max }: { value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <input
      type="number" inputMode="numeric" min={min} max={max}
      value={Number.isFinite(value) ? value : ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
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
