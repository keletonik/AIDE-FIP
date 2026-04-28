import { all, one, run } from './db';

export type ServiceTemplate = {
  id: number;
  code: string;
  label: string;
  frequency: string;
  standard_id: string | null;
  items: string[];
};

export type ServiceRecord = {
  id: number;
  site_id: number;
  template_id: number;
  performed_at: string;
  performed_by: number | null;
  results: { item: string; pass: boolean; notes: string }[];
  overall: 'pass' | 'partial' | 'fail';
  notes: string | null;
  template_label?: string;
  template_code?: string;
  performed_by_name?: string | null;
};

type TemplateRow = Omit<ServiceTemplate, 'items'> & { items_json: string };
type RecordRow = Omit<ServiceRecord, 'results'> & { results_json: string };

export const serviceTemplates = {
  list: (): ServiceTemplate[] => {
    return all<TemplateRow>(`SELECT * FROM service_templates ORDER BY frequency, label`)
      .map(r => ({ ...r, items: JSON.parse(r.items_json) as string[] }));
  },
  get: (id: number): ServiceTemplate | undefined => {
    const r = one<TemplateRow>(`SELECT * FROM service_templates WHERE id = ?`, [id]);
    return r ? { ...r, items: JSON.parse(r.items_json) } : undefined;
  },
  byCode: (code: string): ServiceTemplate | undefined => {
    const r = one<TemplateRow>(`SELECT * FROM service_templates WHERE code = ?`, [code]);
    return r ? { ...r, items: JSON.parse(r.items_json) } : undefined;
  },
};

export const serviceRecords = {
  forSite: (siteId: number): ServiceRecord[] => {
    const rows = all<RecordRow & { template_label: string; template_code: string; performed_by_name: string | null }>(`
      SELECT sr.*, st.label AS template_label, st.code AS template_code, u.name AS performed_by_name
      FROM service_records sr
      JOIN service_templates st ON st.id = sr.template_id
      LEFT JOIN users u ON u.id = sr.performed_by
      WHERE sr.site_id = ?
      ORDER BY sr.performed_at DESC
    `, [siteId]);
    return rows.map(r => ({ ...r, results: JSON.parse(r.results_json) }));
  },
  get: (id: number): ServiceRecord | undefined => {
    const r = one<RecordRow & { template_label: string; template_code: string }>(`
      SELECT sr.*, st.label AS template_label, st.code AS template_code
      FROM service_records sr
      JOIN service_templates st ON st.id = sr.template_id
      WHERE sr.id = ?
    `, [id]);
    return r ? { ...r, results: JSON.parse(r.results_json) } : undefined;
  },
  create: (r: {
    site_id: number;
    template_id: number;
    performed_by: number | null;
    results: { item: string; pass: boolean; notes: string }[];
    overall: ServiceRecord['overall'];
    notes: string | null;
  }) => {
    const info = run(`
      INSERT INTO service_records (site_id, template_id, performed_by, results_json, overall, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [r.site_id, r.template_id, r.performed_by, JSON.stringify(r.results), r.overall, r.notes]);
    return info.lastInsertRowid as number;
  },
};
