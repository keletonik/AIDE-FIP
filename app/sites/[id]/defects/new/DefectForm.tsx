'use client';

import { useState } from 'react';

const SEVERITIES: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

export function DefectForm({ siteId }: { siteId: number }) {
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const r = await fetch(`/api/sites/${siteId}/defects`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ severity, description, location: location || null }),
      });
      if (!r.ok) { setError((await r.json().catch(() => ({}))).error || 'failed'); return; }
      const { id } = await r.json();

      if (files && files.length > 0) {
        const fd = new FormData();
        for (const f of Array.from(files)) fd.append('photo', f);
        await fetch(`/api/defects/${id}/photos`, { method: 'POST', body: fd });
      }
      window.location.href = `/sites/${siteId}/defects/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network');
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Severity">
        <select value={severity} onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Description *"><textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Location (zone, room, asset id)"><input value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
      <Field label="Photos (optional, multi-select)">
        <input type="file" accept="image/*" multiple capture="environment" onChange={(e) => setFiles(e.target.files)} />
      </Field>
      {error && <p className="text-warn text-sm">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Raise defect'}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
