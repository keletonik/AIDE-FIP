'use client';

import { useEffect, useState, useCallback } from 'react';

type Project = { id: number; name: string; standby_hours: number; alarm_minutes: number; ageing_factor: number };
type Pp = { id: number; project_id: number; panel_slug: string; label: string; extra_standby_ma: number; extra_alarm_ma: number };
type Result = {
  totalStandbyMa: number; totalAlarmMa: number;
  standbyHours: number; alarmMinutes: number; ageingFactor: number;
  requiredAh: number; suggestedAh: number;
  perPanel: { panelSlug: string; standbyMa: number; alarmMa: number; requiredAh: number; suggestedAh: number }[];
};

export function ProjectEditor({ project, initial, catalogue, canEdit }: {
  project: Project;
  initial: Pp[];
  catalogue: { slug: string; name: string }[];
  canEdit: boolean;
}) {
  const [panels, setPanels] = useState<Pp[]>(initial);
  const [draft, setDraft] = useState({ panel_slug: catalogue[0]?.slug ?? '', label: '', extra_standby_ma: 0, extra_alarm_ma: 0 });
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);

  const recompute = useCallback(async () => {
    setPending(true);
    try {
      const r = await fetch(`/api/projects/${project.id}/calc`, { method: 'POST' });
      if (r.ok) setResult(await r.json());
    } finally { setPending(false); }
  }, [project.id]);

  useEffect(() => { recompute(); }, [recompute, panels.length]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/projects/${project.id}/panels`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft),
    });
    if (r.ok) {
      const created = await r.json();
      setPanels(p => [...p, created.panel]);
      setDraft({ panel_slug: catalogue[0]?.slug ?? '', label: '', extra_standby_ma: 0, extra_alarm_ma: 0 });
    }
  }
  async function remove(id: number) {
    const r = await fetch(`/api/projects/${project.id}/panels/${id}`, { method: 'DELETE' });
    if (r.ok) setPanels(p => p.filter(x => x.id !== id));
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-muted">Panels in scope</h2>
        <ul className="space-y-2">
          {panels.length === 0 && <li className="text-muted text-sm">No panels added yet.</li>}
          {panels.map(p => (
            <li key={p.id} className="card p-3 flex items-baseline justify-between gap-2">
              <div>
                <div className="text-head">{p.label}</div>
                <div className="text-xs text-muted">{p.panel_slug} · extras: {p.extra_standby_ma}/{p.extra_alarm_ma} mA</div>
              </div>
              {canEdit && <button className="btn" onClick={() => remove(p.id)}>×</button>}
            </li>
          ))}
        </ul>

        {canEdit && (
          <form onSubmit={add} className="card p-3 space-y-2">
            <h3 className="text-sm uppercase tracking-wide text-muted">Add panel</h3>
            <select value={draft.panel_slug} onChange={(e) => setDraft({ ...draft, panel_slug: e.target.value })}>
              {catalogue.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input placeholder="Label (e.g. Building A FIP)" required value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} placeholder="Extra standby mA" value={draft.extra_standby_ma} onChange={(e) => setDraft({ ...draft, extra_standby_ma: parseFloat(e.target.value) || 0 })} />
              <input type="number" min={0} placeholder="Extra alarm mA" value={draft.extra_alarm_ma} onChange={(e) => setDraft({ ...draft, extra_alarm_ma: parseFloat(e.target.value) || 0 })} />
            </div>
            <button className="btn btn-primary">+ Add</button>
          </form>
        )}
      </div>

      <div className="card p-3 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-head">Roll-up</h2>
          {pending && <span className="text-xs text-muted">recalculating…</span>}
        </div>
        {result ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Big label="Required" value={`${result.requiredAh.toFixed(1)} Ah`} />
              <Big label="Fit"      value={`${result.suggestedAh} Ah`} accent />
            </div>
            <table>
              <tbody>
                <tr><td className="text-muted">Total standby</td><td>{result.totalStandbyMa.toFixed(0)} mA</td></tr>
                <tr><td className="text-muted">Total alarm</td><td>{result.totalAlarmMa.toFixed(0)} mA</td></tr>
                <tr><td className="text-muted">Horizon</td><td>{result.standbyHours} h + {result.alarmMinutes} min</td></tr>
                <tr><td className="text-muted">Ageing</td><td>×{result.ageingFactor.toFixed(2)}</td></tr>
              </tbody>
            </table>
            <details>
              <summary className="text-sm text-muted cursor-pointer">Per-panel breakdown</summary>
              <table className="mt-2">
                <thead><tr><th>Panel</th><th>Standby</th><th>Alarm</th><th>Required</th><th>Fit</th></tr></thead>
                <tbody>
                  {result.perPanel.map((p, i) => (
                    <tr key={i}>
                      <td>{p.panelSlug}</td>
                      <td>{p.standbyMa.toFixed(0)} mA</td>
                      <td>{p.alarmMa.toFixed(0)} mA</td>
                      <td>{p.requiredAh.toFixed(1)} Ah</td>
                      <td>{p.suggestedAh} Ah</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : <p className="text-muted text-sm">Add a panel to see the roll-up.</p>}
      </div>
    </div>
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
