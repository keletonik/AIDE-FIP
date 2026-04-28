'use client';

import { useState } from 'react';

export function BrigadeForm({ siteId }: { siteId: number }) {
  const [line, setLine] = useState('');
  const [centre, setCentre] = useState('');
  const [received, setReceived] = useState(true);
  const [seconds, setSeconds] = useState<number | ''>('');
  const [witnesses, setWitnesses] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const r = await fetch(`/api/sites/${siteId}/brigade-tests`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          line_id: line || null,
          monitoring_centre: centre || null,
          ase_signal_received: received,
          response_seconds: seconds === '' ? null : seconds,
          witnesses: witnesses || null,
          notes: notes || null,
        }),
      });
      if (!r.ok) { setError((await r.json().catch(() => ({}))).error || 'failed'); return; }
      window.location.href = `/sites/${siteId}`;
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Line / circuit ID"><input value={line} onChange={(e) => setLine(e.target.value)} /></Field>
        <Field label="Monitoring centre"><input value={centre} onChange={(e) => setCentre(e.target.value)} /></Field>
      </div>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={received} onChange={(e) => setReceived(e.target.checked)} />
        <span className="text-body">Signal received at monitoring centre</span>
      </label>
      <Field label="Response time (seconds)">
        <input type="number" min={0} value={seconds} onChange={(e) => setSeconds(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
      </Field>
      <Field label="Witnesses"><input value={witnesses} onChange={(e) => setWitnesses(e.target.value)} placeholder="Names / company / role" /></Field>
      <Field label="Notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      {error && <p className="text-warn text-sm">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Log brigade test'}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
