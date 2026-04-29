'use client';

import { useState } from 'react';

const SEVERITIES: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
const MAX_PHOTOS = 12;

export function DefectForm({ siteId }: { siteId: number }) {
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (files && files.length > MAX_PHOTOS) {
      setError(`Too many photos (max ${MAX_PHOTOS}). Resubmit with fewer.`);
      return;
    }
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
        const pr = await fetch(`/api/defects/${id}/photos`, { method: 'POST', body: fd });
        if (!pr.ok) {
          setError(`Defect saved, but photo upload failed: ${(await pr.json().catch(() => ({}))).error || pr.status}`);
          return;
        }
      }
      window.location.href = `/sites/${siteId}/defects/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network');
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
      <Field id="def-severity" label="Severity">
        <select id="def-severity" name="severity"
          value={severity} onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field id="def-description" label="Description *">
        <textarea id="def-description" name="description" required rows={4}
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field id="def-location" label="Location (zone, room, asset id)">
        <input id="def-location" name="location" type="text"
          value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <fieldset className="space-y-2">
        <legend className="block text-sm text-muted">Photos (optional, max {MAX_PHOTOS})</legend>
        <label htmlFor="def-photo-camera" className="block space-y-1">
          <span className="block text-xs text-muted">Take a photo</span>
          <input id="def-photo-camera" name="photo-camera" type="file"
            accept="image/*" capture="environment"
            onChange={(e) => setFiles(e.target.files)} />
        </label>
        <label htmlFor="def-photo-library" className="block space-y-1">
          <span className="block text-xs text-muted">…or choose from library</span>
          <input id="def-photo-library" name="photo-library" type="file"
            accept="image/*" multiple
            onChange={(e) => setFiles(e.target.files)} />
        </label>
        {files && files.length > 0 && <p className="text-xs text-muted">{files.length} file{files.length === 1 ? '' : 's'} selected</p>}
      </fieldset>
      {error && <p role="alert" className="text-warn text-sm">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Saving…' : 'Raise defect'}
      </button>
    </form>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
