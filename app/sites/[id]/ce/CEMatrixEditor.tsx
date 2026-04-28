'use client';

import { useState } from 'react';

type Matrix = {
  id: number;
  name: string;
  zones: string[];
  outputs: string[];
  cells: string[][]; // [zoneIndex][outputIndex]
};

const STATES = ['', 'X', 'D', 'M']; // blank / triggered / delayed / manual

export function CEMatrixEditor({ siteId, all, active, canEdit }: {
  siteId: number;
  all: Matrix[];
  active?: Matrix;
  canEdit: boolean;
}) {
  const [matrix, setMatrix] = useState<Matrix | null>(active ?? null);
  const [pending, setPending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  function blank(): Matrix {
    const zones = ['Zone 1', 'Zone 2'];
    const outputs = ['Sounders G1', 'Brigade signal'];
    return {
      id: 0, name: 'New matrix', zones, outputs,
      cells: zones.map(() => outputs.map(() => '')),
    };
  }

  function newMatrix() { setMatrix(blank()); setInfo(null); }

  async function save() {
    if (!matrix) return;
    setPending(true); setInfo(null);
    try {
      const r = await fetch(`/api/ce-matrices${matrix.id ? `/${matrix.id}` : `?site=${siteId}`}`, {
        method: matrix.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: matrix.name,
          zones: matrix.zones,
          outputs: matrix.outputs,
          cells: matrix.cells,
        }),
      });
      if (!r.ok) { setInfo('save failed: ' + ((await r.json().catch(() => ({}))).error || 'unknown')); return; }
      const data = await r.json();
      if (!matrix.id && data.id) setMatrix({ ...matrix, id: data.id });
      setInfo('saved');
    } finally { setPending(false); }
  }

  function setCell(z: number, o: number, val: string) {
    if (!matrix || !canEdit) return;
    const cells = matrix.cells.map(row => row.slice());
    cells[z][o] = val;
    setMatrix({ ...matrix, cells });
  }

  function addZone() {
    if (!matrix) return;
    const zones = [...matrix.zones, `Zone ${matrix.zones.length + 1}`];
    const cells = [...matrix.cells, matrix.outputs.map(() => '')];
    setMatrix({ ...matrix, zones, cells });
  }
  function addOutput() {
    if (!matrix) return;
    const outputs = [...matrix.outputs, 'New output'];
    const cells = matrix.cells.map(r => [...r, '']);
    setMatrix({ ...matrix, outputs, cells });
  }
  function renameZone(i: number, v: string) {
    if (!matrix) return;
    const zones = matrix.zones.slice(); zones[i] = v;
    setMatrix({ ...matrix, zones });
  }
  function renameOutput(i: number, v: string) {
    if (!matrix) return;
    const outputs = matrix.outputs.slice(); outputs[i] = v;
    setMatrix({ ...matrix, outputs });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {all.map(m => (
            <a key={m.id} href={`?id=${m.id}`} className={`btn ${matrix?.id === m.id ? 'btn-primary' : ''}`}>{m.name}</a>
          ))}
          {canEdit && <button className="btn" onClick={newMatrix}>+ New matrix</button>}
        </div>
        {info && <span className="text-xs text-muted">{info}</span>}
      </div>

      {!matrix ? (
        <p className="text-muted text-sm">No matrix selected. Create one to map zones to outputs.</p>
      ) : (
        <>
          <label className="block space-y-1 max-w-md">
            <span className="block text-sm text-muted">Matrix name</span>
            <input value={matrix.name} disabled={!canEdit} onChange={(e) => setMatrix({ ...matrix, name: e.target.value })} />
          </label>

          <div className="overflow-auto card p-2">
            <table className="text-sm">
              <thead>
                <tr>
                  <th></th>
                  {matrix.outputs.map((o, i) => (
                    <th key={i} className="min-w-[140px]">
                      <input value={o} disabled={!canEdit} onChange={(e) => renameOutput(i, e.target.value)} className="!p-1 !text-xs" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.zones.map((z, zi) => (
                  <tr key={zi}>
                    <th className="min-w-[160px]">
                      <input value={z} disabled={!canEdit} onChange={(e) => renameZone(zi, e.target.value)} className="!p-1 !text-xs" />
                    </th>
                    {matrix.outputs.map((_, oi) => (
                      <td key={oi}>
                        <select
                          value={matrix.cells[zi]?.[oi] ?? ''}
                          disabled={!canEdit}
                          onChange={(e) => setCell(zi, oi, e.target.value)}
                          className="!p-1 !text-xs"
                        >
                          {STATES.map(s => <option key={s} value={s}>{s || '—'}</option>)}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted">Cell legend: <span className="kbd">X</span> activate · <span className="kbd">D</span> delayed · <span className="kbd">M</span> manual override · blank = no action.</p>

          {canEdit && (
            <div className="flex gap-2">
              <button className="btn" onClick={addZone}>+ Add zone</button>
              <button className="btn" onClick={addOutput}>+ Add output</button>
              <button className="btn btn-primary ml-auto" onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save matrix'}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
