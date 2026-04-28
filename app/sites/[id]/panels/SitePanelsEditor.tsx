'use client';

import { useState } from 'react';

type SP = { id: number; site_id: number; panel_slug: string; label: string; location: string | null; install_date: string | null; notes: string | null };

export function SitePanelsEditor({ siteId, initial, catalogue, canEdit }: {
  siteId: number;
  initial: SP[];
  catalogue: { slug: string; name: string }[];
  canEdit: boolean;
}) {
  const [list, setList] = useState<SP[]>(initial);
  const [draft, setDraft] = useState({ panel_slug: catalogue[0]?.slug ?? '', label: '', location: '', install_date: '' });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const r = await fetch(`/api/sites/${siteId}/panels`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...draft, install_date: draft.install_date || null, location: draft.location || null }),
      });
      if (!r.ok) { setError((await r.json().catch(() => ({}))).error || 'failed'); return; }
      const created = await r.json();
      setList(l => [...l, created.panel]);
      setDraft({ panel_slug: catalogue[0]?.slug ?? '', label: '', location: '', install_date: '' });
    } finally { setPending(false); }
  }

  async function remove(id: number) {
    if (!confirm('Remove this panel from the site?')) return;
    const r = await fetch(`/api/sites/${siteId}/panels/${id}`, { method: 'DELETE' });
    if (r.ok) setList(l => l.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {list.length === 0 && <li className="text-muted text-sm">No panels yet.</li>}
        {list.map(p => (
          <li key={p.id} className="card p-3 flex items-baseline justify-between gap-3">
            <div>
              <div className="text-head">{p.label} <span className="text-muted text-sm">· {p.panel_slug}</span></div>
              <div className="text-xs text-muted">{p.location ?? ''}{p.install_date ? ` · installed ${p.install_date}` : ''}</div>
            </div>
            <div className="flex gap-2">
              <a className="btn" href={`/sites/${siteId}/panels/${p.id}/detectors`}>Detectors →</a>
              {canEdit && <button className="btn" onClick={() => remove(p.id)}>Remove</button>}
            </div>
          </li>
        ))}
      </ul>

      {canEdit && (
        <form onSubmit={add} className="card p-3 space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-muted">Add panel</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Panel model">
              <select value={draft.panel_slug} onChange={(e) => setDraft({ ...draft, panel_slug: e.target.value })}>
                {catalogue.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Label / asset id"><input required value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
            <Field label="Location"><input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></Field>
            <Field label="Install date"><input type="date" value={draft.install_date} onChange={(e) => setDraft({ ...draft, install_date: e.target.value })} /></Field>
          </div>
          {error && <p className="text-warn text-sm">{error}</p>}
          <button className="btn btn-primary" disabled={pending}>{pending ? 'Adding…' : 'Add panel'}</button>
        </form>
      )}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
