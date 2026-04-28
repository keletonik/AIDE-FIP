'use client';
import { useState } from 'react';

export function ProjectNewForm({ sites }: { sites: { id: number; name: string }[] }) {
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState<number | ''>('');
  const [standbyHours, setStandbyHours] = useState(24);
  const [alarmMinutes, setAlarmMinutes] = useState(30);
  const [ageingFactor, setAgeingFactor] = useState(1.25);
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const r = await fetch('/api/projects', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        site_id: siteId === '' ? null : siteId,
        standby_hours: standbyHours, alarm_minutes: alarmMinutes,
        ageing_factor: ageingFactor, notes: notes || null,
      }),
    });
    setPending(false);
    if (r.ok) {
      const data = await r.json();
      window.location.href = `/projects/${data.id}`;
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Name *"><input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Site (optional)">
        <select value={siteId} onChange={(e) => setSiteId(e.target.value === '' ? '' : parseInt(e.target.value, 10))}>
          <option value="">— none —</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Standby hours"><input type="number" min={1} max={72} value={standbyHours} onChange={(e) => setStandbyHours(parseInt(e.target.value, 10) || 24)} /></Field>
        <Field label="Alarm minutes"><input type="number" min={5} max={240} value={alarmMinutes} onChange={(e) => setAlarmMinutes(parseInt(e.target.value, 10) || 30)} /></Field>
      </div>
      <Field label={`Ageing factor (${ageingFactor.toFixed(2)})`}>
        <input type="range" min={1} max={2} step={0.05} value={ageingFactor} onChange={(e) => setAgeingFactor(parseFloat(e.target.value))} />
      </Field>
      <Field label="Notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Creating…' : 'Create'}</button>
    </form>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
