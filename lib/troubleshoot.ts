import { all, one } from './db';

export type Symptom = { slug: string; title: string; panel_filter: string | null };
export type Cause = { id: number; symptom_slug: string; cause: string; remediation: string; rank: number };

export function listSymptoms(): Symptom[] {
  return all<Symptom>(`SELECT slug, title, panel_filter FROM symptoms ORDER BY title ASC`);
}

export function getSymptom(slug: string): Symptom | undefined {
  return one<Symptom>(`SELECT slug, title, panel_filter FROM symptoms WHERE slug = ?`, [slug]);
}

export function causesFor(slug: string): Cause[] {
  return all<Cause>(`
    SELECT id, symptom_slug, cause, remediation, rank
    FROM symptom_causes
    WHERE symptom_slug = ?
    ORDER BY rank ASC, id ASC
  `, [slug]);
}

// Naive but useful keyword search across symptom titles. Field techs
// type "earth", "charger", "ase" — we don't need semantic search for this.
export function searchSymptoms(q: string): Symptom[] {
  const term = `%${q.trim().toLowerCase()}%`;
  return all<Symptom>(`
    SELECT slug, title, panel_filter
    FROM symptoms
    WHERE LOWER(title) LIKE ?
    ORDER BY title ASC
  `, [term]);
}
