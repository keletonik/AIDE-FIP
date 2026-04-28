import { all, one, run } from './db';

export type BrigadeTest = {
  id: number;
  site_id: number;
  performed_at: string;
  performed_by: number | null;
  line_id: string | null;
  monitoring_centre: string | null;
  ase_signal_received: 0 | 1;
  response_seconds: number | null;
  witnesses: string | null;
  notes: string | null;
};

export const brigadeTests = {
  forSite: (siteId: number): BrigadeTest[] =>
    all<BrigadeTest>(`SELECT * FROM brigade_tests WHERE site_id = ? ORDER BY performed_at DESC`, [siteId]),
  create: (b: Omit<BrigadeTest, 'id' | 'performed_at'>) => {
    const info = run(`
      INSERT INTO brigade_tests (site_id, performed_by, line_id, monitoring_centre, ase_signal_received, response_seconds, witnesses, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [b.site_id, b.performed_by, b.line_id, b.monitoring_centre, b.ase_signal_received, b.response_seconds, b.witnesses, b.notes]);
    return info.lastInsertRowid as number;
  },
};
