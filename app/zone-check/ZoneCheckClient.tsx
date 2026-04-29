'use client';

import { useMemo, useState } from 'react';
import { checkZones } from '@/lib/zonecheck';

export function ZoneCheckClient() {
  const [area, setArea] = useState(8000);
  const [floors, setFloors] = useState(8);
  const [sleeping, setSleeping] = useState(false);
  const [stairs, setStairs] = useState(2);
  const [lifts, setLifts] = useState(2);
  const [risers, setRisers] = useState(1);
  const [plant, setPlant] = useState(1);
  const [roof, setRoof] = useState(true);

  const result = useMemo(() => checkZones({
    floor_area_m2: area, floors, sleeping_risk: sleeping,
    stairs, lift_shafts: lifts, risers, plant_rooms: plant, roof_void: roof,
  }), [area, floors, sleeping, stairs, lifts, risers, plant, roof]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()} aria-label="Zone check inputs">
        <Field id="zc-area" label="Total floor area (m²)">
          <input id="zc-area" name="area" type="number" inputMode="numeric"
            min={10} max={500000} value={area} onChange={(e) => setArea(parseInt(e.target.value) || 0)} />
        </Field>
        <Field id="zc-floors" label="Number of floors">
          <input id="zc-floors" name="floors" type="number" inputMode="numeric"
            min={1} max={100} value={floors} onChange={(e) => setFloors(parseInt(e.target.value) || 0)} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sleeping} onChange={(e) => setSleeping(e.target.checked)} />
          <span>Sleeping risk (Class 2 / 3 / 9a / 9c) — caps zone area at 1000 m²</span>
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Mandatory split zones</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field id="zc-stairs" label="Stairs">
              <input id="zc-stairs" name="stairs" type="number" inputMode="numeric"
                min={0} max={50} value={stairs} onChange={(e) => setStairs(parseInt(e.target.value) || 0)} />
            </Field>
            <Field id="zc-lifts" label="Lift shafts">
              <input id="zc-lifts" name="lifts" type="number" inputMode="numeric"
                min={0} max={50} value={lifts} onChange={(e) => setLifts(parseInt(e.target.value) || 0)} />
            </Field>
            <Field id="zc-risers" label="Risers / service shafts">
              <input id="zc-risers" name="risers" type="number" inputMode="numeric"
                min={0} max={50} value={risers} onChange={(e) => setRisers(parseInt(e.target.value) || 0)} />
            </Field>
            <Field id="zc-plant" label="Plant rooms">
              <input id="zc-plant" name="plant" type="number" inputMode="numeric"
                min={0} max={50} value={plant} onChange={(e) => setPlant(parseInt(e.target.value) || 0)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={roof} onChange={(e) => setRoof(e.target.checked)} />
            <span>Roof void requires its own zone</span>
          </label>
        </fieldset>
      </form>

      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold text-head">Result</h2>
        <div className="grid grid-cols-2 gap-2">
          <Big label="Total zones" value={`${result.total_zones}`} accent />
          <Big label="Splits" value={`${result.mandatory_split_zones}`} />
        </div>
        <table>
          <tbody>
            {result.workings.map((w, i) => (
              <tr key={i}><td className="text-muted">{w.label}</td><td className="text-body">{w.value}</td></tr>
            ))}
          </tbody>
        </table>
        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => <p key={i} className="text-sm text-amber">⚠ {w}</p>)}
          </div>
        )}
        <p className="text-xs text-muted">
          AS 1670.1 §4.3 paraphrased. Verify against the project's fire engineering report — class
          determination (sleeping risk, large isolated openings, atria) overrides defaults.
        </p>
      </div>
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
