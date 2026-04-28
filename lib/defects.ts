import { all, one, run } from './db';

export type Defect = {
  id: number;
  site_id: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  raised_at: string;
  raised_by: number | null;
  resolved_at: string | null;
  resolved_by: number | null;
  resolution: string | null;
};

export type DefectPhoto = {
  id: number;
  defect_id: number;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  caption: string | null;
  taken_at: string;
};

export const defects = {
  forSite: (siteId: number): Defect[] =>
    all<Defect>(`SELECT * FROM defects WHERE site_id = ? ORDER BY raised_at DESC`, [siteId]),
  open: (): (Defect & { site_name: string })[] =>
    all(`
      SELECT d.*, s.name AS site_name
      FROM defects d JOIN sites s ON s.id = d.site_id
      WHERE d.status != 'resolved'
      ORDER BY CASE d.severity
        WHEN 'critical' THEN 1
        WHEN 'high'     THEN 2
        WHEN 'medium'   THEN 3
        ELSE 4 END, d.raised_at DESC
    `),
  get:  (id: number) => one<Defect>(`SELECT * FROM defects WHERE id = ?`, [id]),
  create: (d: Omit<Defect, 'id' | 'raised_at' | 'resolved_at' | 'resolved_by' | 'resolution' | 'status'> & { status?: Defect['status'] }) => {
    const info = run(`
      INSERT INTO defects (site_id, severity, description, location, status, raised_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [d.site_id, d.severity, d.description, d.location, d.status ?? 'open', d.raised_by]);
    return info.lastInsertRowid as number;
  },
  resolve: (id: number, by: number, resolution: string) => {
    run(`UPDATE defects SET status = 'resolved', resolved_at = datetime('now'), resolved_by = ?, resolution = ? WHERE id = ?`,
      [by, resolution, id]);
  },
  reopen: (id: number) => {
    run(`UPDATE defects SET status = 'open', resolved_at = NULL, resolved_by = NULL, resolution = NULL WHERE id = ?`, [id]);
  },
  setStatus: (id: number, status: Defect['status']) => {
    run(`UPDATE defects SET status = ? WHERE id = ?`, [status, id]);
  },
};

export const defectPhotos = {
  forDefect: (defectId: number): DefectPhoto[] =>
    all<DefectPhoto>(`SELECT * FROM defect_photos WHERE defect_id = ? ORDER BY taken_at`, [defectId]),
  add: (p: Omit<DefectPhoto, 'id' | 'taken_at'>) => {
    const info = run(`
      INSERT INTO defect_photos (defect_id, file_path, mime_type, size_bytes, caption)
      VALUES (?, ?, ?, ?, ?)
    `, [p.defect_id, p.file_path, p.mime_type, p.size_bytes, p.caption]);
    return info.lastInsertRowid as number;
  },
};
