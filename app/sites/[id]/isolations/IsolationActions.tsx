'use client';

import { useState } from 'react';

export function IsolationActions({ id }: { id: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function restore() {
    if (!confirm('Restore this isolation? This stamps it closed in the audit trail.')) return;
    setPending(true); setError(null);
    try {
      const r = await fetch(`/api/isolations/${id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!r.ok) {
        setError((await r.json().catch(() => ({}))).error || 'failed');
        return;
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <button onClick={restore} disabled={pending} className="btn btn-primary">
        {pending ? 'Restoring…' : 'Mark restored ✓'}
      </button>
      {error && <span role="alert" className="text-warn text-sm">{error}</span>}
    </div>
  );
}
