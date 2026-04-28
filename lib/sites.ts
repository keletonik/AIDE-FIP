import { all, one, run } from './db';

export type Site = {
  id: number;
  name: string;
  address: string | null;
  suburb: string | null;
  postcode: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
};

export type SitePanel = {
  id: number;
  site_id: number;
  panel_slug: string;
  label: string;
  location: string | null;
  install_date: string | null;
  notes: string | null;
};

export const sites = {
  list: (): Site[] => all<Site>(`SELECT * FROM sites ORDER BY name`),
  get:  (id: number) => one<Site>(`SELECT * FROM sites WHERE id = ?`, [id]),
  create: (s: Omit<Site, 'id' | 'created_at'>): number => {
    const info = run(`
      INSERT INTO sites (name, address, suburb, postcode, contact_name, contact_phone, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [s.name, s.address, s.suburb, s.postcode, s.contact_name, s.contact_phone, s.notes, s.created_by]);
    return info.lastInsertRowid as number;
  },
  update: (id: number, s: Partial<Omit<Site, 'id' | 'created_at' | 'created_by'>>) => {
    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(s)) { fields.push(`${k} = ?`); vals.push(v ?? null); }
    if (fields.length === 0) return;
    vals.push(id);
    run(`UPDATE sites SET ${fields.join(', ')} WHERE id = ?`, vals);
  },
  remove: (id: number) => run(`DELETE FROM sites WHERE id = ?`, [id]),
};

export const sitePanels = {
  forSite: (siteId: number): SitePanel[] =>
    all<SitePanel>(`SELECT * FROM site_panels WHERE site_id = ? ORDER BY label`, [siteId]),
  get: (id: number) => one<SitePanel>(`SELECT * FROM site_panels WHERE id = ?`, [id]),
  create: (sp: Omit<SitePanel, 'id'>): number => {
    const info = run(`
      INSERT INTO site_panels (site_id, panel_slug, label, location, install_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sp.site_id, sp.panel_slug, sp.label, sp.location, sp.install_date, sp.notes]);
    return info.lastInsertRowid as number;
  },
  remove: (id: number) => run(`DELETE FROM site_panels WHERE id = ?`, [id]),
};
