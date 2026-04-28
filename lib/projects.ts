import { all, one, run } from './db';

export type BatteryProject = {
  id: number;
  name: string;
  site_id: number | null;
  standby_hours: number;
  alarm_minutes: number;
  ageing_factor: number;
  notes: string | null;
  created_by: number | null;
  created_at: string;
};

export type BatteryProjectPanel = {
  id: number;
  project_id: number;
  panel_slug: string;
  label: string;
  extra_standby_ma: number;
  extra_alarm_ma: number;
};

export const batteryProjects = {
  list: (): BatteryProject[] => all<BatteryProject>(`SELECT * FROM battery_projects ORDER BY created_at DESC`),
  get:  (id: number) => one<BatteryProject>(`SELECT * FROM battery_projects WHERE id = ?`, [id]),
  create: (p: Omit<BatteryProject, 'id' | 'created_at'>): number => {
    const info = run(`
      INSERT INTO battery_projects (name, site_id, standby_hours, alarm_minutes, ageing_factor, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [p.name, p.site_id, p.standby_hours, p.alarm_minutes, p.ageing_factor, p.notes, p.created_by]);
    return info.lastInsertRowid as number;
  },
  update: (id: number, p: Partial<Omit<BatteryProject, 'id' | 'created_at' | 'created_by'>>) => {
    const fields: string[] = [], vals: unknown[] = [];
    for (const [k, v] of Object.entries(p)) { fields.push(`${k} = ?`); vals.push(v ?? null); }
    if (!fields.length) return;
    vals.push(id);
    run(`UPDATE battery_projects SET ${fields.join(', ')} WHERE id = ?`, vals);
  },
  remove: (id: number) => run(`DELETE FROM battery_projects WHERE id = ?`, [id]),
  panels: (projectId: number): BatteryProjectPanel[] =>
    all<BatteryProjectPanel>(`SELECT * FROM battery_project_panels WHERE project_id = ? ORDER BY label`, [projectId]),
  addPanel: (p: Omit<BatteryProjectPanel, 'id'>): number => {
    const info = run(`
      INSERT INTO battery_project_panels (project_id, panel_slug, label, extra_standby_ma, extra_alarm_ma)
      VALUES (?, ?, ?, ?, ?)
    `, [p.project_id, p.panel_slug, p.label, p.extra_standby_ma, p.extra_alarm_ma]);
    return info.lastInsertRowid as number;
  },
  removePanel: (id: number) => run(`DELETE FROM battery_project_panels WHERE id = ?`, [id]),
};
