import { all, one, run } from './db';

export type IsolationScope = 'point' | 'zone' | 'loop' | 'sounder' | 'output' | 'panel';

export type Isolation = {
  id: number;
  site_id: number;
  site_panel_id: number | null;
  scope: IsolationScope;
  target: string;
  reason: string;
  isolated_by: number | null;
  isolated_at: string;
  expected_restore_at: string | null;
  restored_by: number | null;
  restored_at: string | null;
  notes: string | null;
};

export type IsolationWithSite = Isolation & { site_name: string };

export const isolations = {
  forSite: (siteId: number): Isolation[] =>
    all<Isolation>(
      `SELECT * FROM isolations WHERE site_id = ? ORDER BY restored_at NULLS FIRST, isolated_at DESC`,
      [siteId],
    ),
  activeForSite: (siteId: number): Isolation[] =>
    all<Isolation>(
      `SELECT * FROM isolations WHERE site_id = ? AND restored_at IS NULL ORDER BY isolated_at DESC`,
      [siteId],
    ),
  allActive: (): IsolationWithSite[] =>
    all<IsolationWithSite>(`
      SELECT i.*, s.name AS site_name
      FROM isolations i JOIN sites s ON s.id = i.site_id
      WHERE i.restored_at IS NULL
      ORDER BY i.isolated_at
    `),
  get: (id: number) => one<Isolation>(`SELECT * FROM isolations WHERE id = ?`, [id]),
  create: (i: Omit<Isolation, 'id' | 'isolated_at' | 'restored_at' | 'restored_by'>) => {
    const info = run(
      `INSERT INTO isolations (site_id, site_panel_id, scope, target, reason, isolated_by, expected_restore_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [i.site_id, i.site_panel_id, i.scope, i.target, i.reason, i.isolated_by, i.expected_restore_at, i.notes],
    );
    return info.lastInsertRowid as number;
  },
  restore: (id: number, by: number, notes?: string | null) => {
    run(
      `UPDATE isolations SET restored_at = datetime('now'), restored_by = ?, notes = COALESCE(?, notes)
       WHERE id = ? AND restored_at IS NULL`,
      [by, notes ?? null, id],
    );
  },
};

// "Hours since" helper used by the dashboard alarms. SQLite stores ISO8601
// timestamps; converting to ms keeps the math in JS land for clarity.
export function hoursSince(isoTs: string): number {
  return (Date.now() - Date.parse(isoTs)) / 3_600_000;
}
