'use client';

import { useMemo, useState } from 'react';

type Template = { id: number; code: string; label: string; frequency: string; items: string[] };

export function ServiceForm({ siteId, templates, initialTemplateId }: {
  siteId: number; templates: Template[]; initialTemplateId: number;
}) {
  const [templateId, setTemplateId] = useState<number>(initialTemplateId);
  const template = useMemo(() => templates.find(t => t.id === templateId), [templateId, templates]);
  const [results, setResults] = useState<{ pass: boolean; notes: string }[]>(
    template?.items.map(() => ({ pass: true, notes: '' })) ?? [],
  );
  const [overall, setOverall] = useState<'pass' | 'partial' | 'fail'>('pass');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset row state when template changes.
  function changeTemplate(id: number) {
    setTemplateId(id);
    const t = templates.find(x => x.id === id);
    setResults(t?.items.map(() => ({ pass: true, notes: '' })) ?? []);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!template) return;
    setPending(true); setError(null);
    try {
      const r = await fetch(`/api/sites/${siteId}/service-records`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          overall,
          notes: notes || null,
          results: template.items.map((item, i) => ({ item, pass: results[i].pass, notes: results[i].notes })),
        }),
      });
      if (!r.ok) { setError((await r.json().catch(() => ({}))).error || 'failed'); return; }
      window.location.href = `/sites/${siteId}`;
    } finally { setPending(false); }
  }

  if (templates.length === 0) {
    return <p className="text-muted">No service templates seeded.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Template</span>
        <select value={templateId} onChange={(e) => changeTemplate(parseInt(e.target.value, 10))}>
          {templates.map(t => <option key={t.id} value={t.id}>{t.label} · {t.frequency}</option>)}
        </select>
      </label>

      {template && (
        <div className="card p-3 space-y-2">
          <h2 className="text-sm uppercase tracking-wide text-muted">Checklist</h2>
          <ol className="space-y-2">
            {template.items.map((item, i) => (
              <li key={i} className="border border-line rounded-md p-2 space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-body">{item}</span>
                  <label className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={results[i]?.pass ?? true} onChange={(e) => {
                      const v = e.target.checked;
                      setResults(rs => rs.map((r, j) => j === i ? { ...r, pass: v } : r));
                    }} />
                    {results[i]?.pass ? 'pass' : 'fail'}
                  </label>
                </div>
                <input
                  placeholder="Notes (optional)"
                  value={results[i]?.notes ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setResults(rs => rs.map((r, j) => j === i ? { ...r, notes: v } : r));
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
      )}

      <label className="block space-y-1">
        <span className="block text-sm text-muted">Overall</span>
        <select value={overall} onChange={(e) => setOverall(e.target.value as 'pass' | 'partial' | 'fail')}>
          <option value="pass">Pass</option>
          <option value="partial">Partial — some items failed</option>
          <option value="fail">Fail — service not complete</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Notes</span>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error && <p className="text-warn text-sm">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Submit service record'}</button>
    </form>
  );
}
