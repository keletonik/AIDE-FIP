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
    <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
      <Field id="site-name" label="Name *">
        <input id="site-name" name="name" type="text" required autoComplete="organization"
          value={s.name} onChange={(e) => update('name', e.target.value)} />
      </Field>
      <Field id="site-address" label="Address">
        <input id="site-address" name="address" type="text" autoComplete="street-address"
          value={s.address} onChange={(e) => update('address', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="site-suburb" label="Suburb">
          <input id="site-suburb" name="suburb" type="text" autoComplete="address-level2"
            value={s.suburb} onChange={(e) => update('suburb', e.target.value)} />
        </Field>
        <Field id="site-postcode" label="Postcode">
          <input id="site-postcode" name="postcode" type="text"
            inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="postal-code"
            value={s.postcode} onChange={(e) => update('postcode', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="site-contact" label="Contact name">
          <input id="site-contact" name="contact_name" type="text" autoComplete="name"
            value={s.contact_name} onChange={(e) => update('contact_name', e.target.value)} />
        </Field>
        <Field id="site-phone" label="Contact phone">
          <input id="site-phone" name="contact_phone" type="tel"
            inputMode="tel" autoComplete="tel"
            value={s.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} />
        </Field>
      </div>
      <Field id="site-notes" label="Notes">
        <textarea id="site-notes" name="notes" rows={4}
          value={s.notes} onChange={(e) => update('notes', e.target.value)} />
      </Field>
      {error && <p role="alert" className="text-warn text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Saving…' : (initial?.id ? 'Save changes' : 'Create site')}
      </button>
    </form>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return <label htmlFor={id} className="block space-y-1"><span className="block text-sm text-muted">{label}</span>{children}</label>;
}
