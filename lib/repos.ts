import { all, one } from './db';

export type Panel = {
  slug: string; name: string; vendor: string; family: string | null;
  loops_max: number | null; notes: string | null; kb_slug: string | null;
};

export type PanelCommand = {
  id: number; panel_slug: string; context: string; label: string; keystrokes: string; notes: string | null;
};

export type Standard = {
  id: string; title: string; summary: string | null; year: number | null; authority: string | null;
};

export type StandardClause = {
  id: number; standard_id: string; number: string; title: string; paraphrase: string | null;
};

export type ProductCategory = { slug: string; label: string; family: string };

export const panels = {
  list:  (): Panel[] => all<Panel>(`SELECT * FROM panels ORDER BY vendor, name`),
  get:   (slug: string) => one<Panel>(`SELECT * FROM panels WHERE slug = ?`, [slug]),
  commands: (slug: string) => all<PanelCommand>(`
    SELECT * FROM panel_commands WHERE panel_slug = ?
    ORDER BY CASE context WHEN 'Day mode' THEN 1 WHEN 'Engineer' THEN 2 ELSE 3 END, id
  `, [slug]),
};

export const standards = {
  list: (): Standard[] => all<Standard>(`SELECT * FROM standards ORDER BY id`),
  get:  (id: string) => one<Standard>(`SELECT * FROM standards WHERE id = ?`, [id]),
  clauses: (id: string) => all<StandardClause>(`
    SELECT * FROM standard_clauses WHERE standard_id = ?
    ORDER BY number
  `, [id]),
};

export const categories = {
  list: (): ProductCategory[] => all<ProductCategory>(`
    SELECT * FROM product_categories ORDER BY family, label
  `),
};
