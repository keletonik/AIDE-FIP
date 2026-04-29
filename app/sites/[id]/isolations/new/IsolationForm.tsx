'use client';

import { useState } from 'react';

const SCOPES = ['point', 'zone', 'loop', 'sounder', 'output', 'panel'] as const;

export function IsolationForm({ siteId, panels }: { siteId: number; panels: { id: number; label: string }[] }) {
  const [scope, setScope] = useState<typeof SCOPES[number]>('zone');
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [panelId, setPanelId] = useState<string>(panels[0]?.id ? String(panels[0].id) : '');
  const [expected, setExpected] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const r = await fetch(`/api/sites/${siteId}/isolations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scope, target, reason,
          site_panel_id: panelId ? parseInt(panelId, 10) : null,
          expected_restore_at: expected || null,
        }),
      });
      if (!r.ok) {
        setError((await r.json().catch(() => ({}))).error || 'failed');
        return;
      }
      window.location.href = `/sites/${siteId}/isolations`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
      <Field id="iso-scope" label="Scope">
        <select id="iso-scope" name="scope" value={scope} onChange={(e) => setScope(e.target.value as typeof SCOPES[number])}>
          {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field id="iso-target" label="Target (zone number, address, label) *">
        <input id="iso-target" name="target" type="text" required maxLength={120}
          value={target} onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g. Loop 2 / Address 1.012  or  Zone 5 — sprinkler riser" />
      </Field>
      <Field id="iso-reason" label="Reason *">
        <textarea id="iso-reason" name="reason" required rows={3} maxLength={500}
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Cleaning works in B3 over weekend; smoke detectors disabled to prevent false dispatch." />
      </Field>
      {panels.length > 0 && (
        <Field id="iso-panel" label="Panel (optional)">
          <select id="iso-panel" name="site_panel_id" value={panelId} onChange={(e) => setPanelId(e.target.value)}>
            <option value="">— not panel-specific —</option>
            {panels.map(p => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
          </select>
        </Field>
      )}
      <Field id="iso-expected" label="Expected restore date / time (optional)">
        <input id="iso-expected" name="expected_restore_at" type="datetime-local"
          value={expected} onChange={(e) => setExpected(e.target.value)} />
      </Field>
      {error && <p role="alert" className="text-warn text-sm">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Logging…' : 'Log isolation'}
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
