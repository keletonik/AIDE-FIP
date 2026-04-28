import { all, one, run } from './db';

export type Detector = {
  id: number;
  site_panel_id: number;
  address: string;
  type: string;
  location: string | null;
  install_date: string | null;
  last_tested_at: string | null;
  replace_by: string | null;
  notes: string | null;
};

export const detectors = {
  forPanel: (sitePanelId: number): Detector[] =>
    all<Detector>(`SELECT * FROM detectors WHERE site_panel_id = ? ORDER BY address`, [sitePanelId]),
  forSite: (siteId: number): (Detector & { panel_label: string })[] =>
    all(`
      SELECT d.*, sp.label AS panel_label
      FROM detectors d JOIN site_panels sp ON sp.id = d.site_panel_id
      WHERE sp.site_id = ?
      ORDER BY sp.label, d.address
    `, [siteId]),
  get: (id: number) => one<Detector>(`SELECT * FROM detectors WHERE id = ?`, [id]),
  create: (d: Omit<Detector, 'id'>) => {
    const info = run(`
      INSERT INTO detectors (site_panel_id, address, type, location, install_date, last_tested_at, replace_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [d.site_panel_id, d.address, d.type, d.location, d.install_date, d.last_tested_at, d.replace_by, d.notes]);
    return info.lastInsertRowid as number;
  },
  update: (id: number, d: Partial<Omit<Detector, 'id' | 'site_panel_id'>>) => {
    const fields: string[] = [], vals: unknown[] = [];
    for (const [k, v] of Object.entries(d)) { fields.push(`${k} = ?`); vals.push(v ?? null); }
    if (!fields.length) return;
    vals.push(id);
    run(`UPDATE detectors SET ${fields.join(', ')} WHERE id = ?`, vals);
  },
  remove: (id: number) => run(`DELETE FROM detectors WHERE id = ?`, [id]),
};

// AS 1670.1 / manufacturer ageing: photoelectric and ionisation typically
// 10 years from manufacture; treat install_date as proxy. Returns the
// age in years and the calculated due-by based on a 10-year horizon
// when no replace_by has been set explicitly.
export function ageingReport(siteId: number) {
  const list = detectors.forSite(siteId);
  const today = new Date();
  return list.map(d => {
    const installed = d.install_date ? new Date(d.install_date) : null;
    const ageYears = installed ? +(((today.getTime() - installed.getTime()) / (365.25 * 86400_000)).toFixed(1)) : null;
    const replaceBy = d.replace_by
      ? new Date(d.replace_by)
      : (installed ? new Date(installed.getFullYear() + 10, installed.getMonth(), installed.getDate()) : null);
    let bucket: 'overdue' | 'due-soon' | 'ok' | 'unknown' = 'unknown';
    if (replaceBy) {
      const diffDays = (replaceBy.getTime() - today.getTime()) / 86400_000;
      bucket = diffDays < 0 ? 'overdue' : diffDays < 365 ? 'due-soon' : 'ok';
    }
    return {
      ...d,
      age_years: ageYears,
      replace_by_calc: replaceBy?.toISOString().slice(0, 10) ?? null,
      bucket,
    };
  });
}
