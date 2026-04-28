'use client';

import { useState } from 'react';

type D = { id: number; address: string; type: string; location: string | null; install_date: string | null; last_tested_at: string | null; replace_by: string | null; notes: string | null };

const TYPES = ['photoelectric', 'ionisation', 'heat-fixed', 'heat-ror', 'multi-criteria', 'beam', 'aspirating', 'flame', 'duct', 'mcp', 'sounder', 'module-input', 'module-output'];

export function DetectorsEditor({ sitePanelId, siteId, initial, canEdit }: {
  sitePanelId: number; siteId: number; initial: D[]; canEdit: boolean;
}) {
  const [list, setList] = useState<D[]>(initial);
  const [draft, setDraft] = useState({ address: '', type: TYPES[0], location: '', install_date: '' });
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await fetch(`/api/site-panels/${sitePanelId}/detectors`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...draft,
        location: draft.location || null,
        install_date: draft.install_date || null,
      }),
    });
    if (!r.ok) { setError((await r.json().catch(() => ({}))).error || 'failed'); return; }
    const data = await r.json();
    setList(l => [...l, data.detector]);
    setDraft({ address: '', type: TYPES[0], location: '', install_date: '' });
  }

  async function markTested(id: number) {
    const r = await fetch(`/api/site-panels/${sitePanelId}/detectors/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ last_tested_at: new Date().toISOString() }),
    });
    if (r.ok) setList(l => l.map(d => d.id === id ? { ...d, last_tested_at: new Date().toISOString() } : d));
  }

  async function remove(id: number) {
    if (!confirm('Remove this detector?')) return;
    const r = await fetch(`/api/site-panels/${sitePanelId}/detectors/${id}`, { method: 'DELETE' });
    if (r.ok) setList(l => l.filter(d => d.id !== id));
  }

  return (
    <div className="space-y-4">
      <table>
        <thead><tr><th>Address</th><th>Type</th><th>Location</th><th>Installed</th><th>Last tested</th><th></th></tr></thead>
        <tbody>
          {list.map(d => (
            <tr key={d.id}>
              <td className="text-head font-mono">{d.address}</td>
              <td>{d.type}</td>
              <td className="text-muted text-sm">{d.location ?? ''}</td>
              <td className="text-muted text-sm">{d.install_date ?? '—'}</td>
              <td className="text-muted text-sm">{d.last_tested_at ?? '—'}</td>
              <td className="flex gap-2">
                {canEdit && <button className="btn" onClick={() => markTested(d.id)}>Mark tested now</button>}
                {canEdit && <button className="btn" onClick={() => remove(d.id)}>×</button>}
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={6} className="text-muted">No detectors yet.</td></tr>}
        </tbody>
      </table>

      {canEdit && (
        <form onSubmit={add} className="card p-3 space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-muted">Add detector</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <input placeholder="Address e.g. 1.012" required value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            <input type="date" value={draft.install_date} onChange={(e) => setDraft({ ...draft, install_date: e.target.value })} />
          </div>
          {error && <p className="text-warn text-sm">{error}</p>}
          <button className="btn btn-primary">+ Add</button>
        </form>
      )}
    </div>
  );
}
