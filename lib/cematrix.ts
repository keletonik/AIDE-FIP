import { all, one, run } from './db';

export type CEMatrix = {
  id: number;
  site_id: number;
  name: string;
  zones: string[];
  outputs: string[];
  /** cells[zoneIndex][outputIndex] = '' | 'X' | 'D' (delayed) | 'M' (manual). */
  cells: string[][];
  updated_by: number | null;
  updated_at: string;
};

type Row = Omit<CEMatrix, 'zones' | 'outputs' | 'cells'> & {
  zones_json: string; outputs_json: string; cells_json: string;
};

function hydrate(r: Row): CEMatrix {
  return {
    id: r.id, site_id: r.site_id, name: r.name,
    zones: JSON.parse(r.zones_json),
    outputs: JSON.parse(r.outputs_json),
    cells: JSON.parse(r.cells_json),
    updated_by: r.updated_by, updated_at: r.updated_at,
  };
}

export const ceMatrices = {
  forSite: (siteId: number): CEMatrix[] =>
    all<Row>(`SELECT * FROM ce_matrices WHERE site_id = ? ORDER BY name`, [siteId]).map(hydrate),
  get: (id: number): CEMatrix | undefined => {
    const r = one<Row>(`SELECT * FROM ce_matrices WHERE id = ?`, [id]);
    return r ? hydrate(r) : undefined;
  },
  create: (m: { site_id: number; name: string; zones: string[]; outputs: string[]; cells: string[][]; updated_by: number | null }) => {
    const info = run(`
      INSERT INTO ce_matrices (site_id, name, zones_json, outputs_json, cells_json, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [m.site_id, m.name, JSON.stringify(m.zones), JSON.stringify(m.outputs), JSON.stringify(m.cells), m.updated_by]);
    return info.lastInsertRowid as number;
  },
  update: (id: number, m: { name: string; zones: string[]; outputs: string[]; cells: string[][]; updated_by: number | null }) => {
    run(`
      UPDATE ce_matrices
      SET name = ?, zones_json = ?, outputs_json = ?, cells_json = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [m.name, JSON.stringify(m.zones), JSON.stringify(m.outputs), JSON.stringify(m.cells), m.updated_by, id]);
  },
  remove: (id: number) => run(`DELETE FROM ce_matrices WHERE id = ?`, [id]),
};
