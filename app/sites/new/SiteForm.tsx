'use client';

import { useState } from 'react';

export function SiteForm({ initial }: { initial?: { id?: number; name?: string; address?: string; suburb?: string; postcode?: string; contact_name?: string; contact_phone?: string; notes?: string } }) {
  const [s, setS] = useState({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    suburb: initial?.suburb ?? '',
    postcode: initial?.postcode ?? '',
    contact_name: initial?.contact_name ?? '',
    contact_phone: initial?.contact_phone ?? '',
    notes: initial?.notes ?? '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const url = initial?.id ? `/api/sites/${initial.id}` : '/api/sites';
      const r = await fetch(url, {
        method: initial?.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!r.ok) { setError((await r.json().catch(() => ({}))).error || 'failed'); return; }
      const data = await r.json();
      window.location.href = `/sites/${initial?.id ?? data.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error');
    } finally { setPending(false); }
  }

  function update<K extends keyof typeof s>(k: K, v: string) { setS(prev => ({ ...prev, [k]: v })); }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Name *"><input required value={s.name} onChange={(e) => update('name', e.target.value)} /></Field>
      <Field label="Address"><input value={s.address} onChange={(e) => update('address', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Suburb"><input value={s.suburb} onChange={(e) => update('suburb', e.target.value)} /></Field>
        <Field label="Postcode"><input value={s.postcode} onChange={(e) => update('postcode', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact name"><input value={s.contact_name} onChange={(e) => update('contact_name', e.target.value)} /></Field>
        <Field label="Contact phone"><input value={s.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} /></Field>
      </div>
      <Field label="Notes"><textarea rows={4} value={s.notes} onChange={(e) => update('notes', e.target.value)} /></Field>
      {error && <p className="text-warn text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Saving…' : (initial?.id ? 'Save changes' : 'Create site')}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
