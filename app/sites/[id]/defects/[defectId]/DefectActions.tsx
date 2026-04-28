'use client';

import { useState } from 'react';

export function DefectActions({ siteId, defectId, status }: { siteId: number; defectId: number; status: 'open' | 'in_progress' | 'resolved' }) {
  const [resolution, setResolution] = useState('');
  const [pending, setPending] = useState(false);

  async function call(action: 'in_progress' | 'resolve' | 'reopen') {
    setPending(true);
    try {
      const r = await fetch(`/api/defects/${defectId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, resolution: action === 'resolve' ? resolution : undefined }),
      });
      if (r.ok) window.location.reload();
    } finally { setPending(false); }
  }

  return (
    <section className="card p-3 space-y-3">
      <h2 className="text-sm uppercase tracking-wide text-muted">Update</h2>
      <div className="flex flex-wrap gap-2">
        {status !== 'in_progress' && status !== 'resolved' && (
          <button className="btn" disabled={pending} onClick={() => call('in_progress')}>Mark in progress</button>
        )}
        {status === 'resolved' && (
          <button className="btn" disabled={pending} onClick={() => call('reopen')}>Reopen</button>
        )}
      </div>
      {status !== 'resolved' && (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="block text-sm text-muted">Resolution notes</span>
            <textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What did you do? Parts replaced, retest result, witness." />
          </label>
          <button className="btn btn-primary" disabled={pending || resolution.trim().length === 0} onClick={() => call('resolve')}>Resolve</button>
        </div>
      )}
    </section>
  );
}
