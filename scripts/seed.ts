/* Seed the SQLite database from the JSON files in /data.
 *
 * Run with: npm run db:seed
 *
 * Idempotent — safe to re-run. Wipes the seed tables (panels, standards,
 * symptoms, categories) but preserves audit_log and debug_log so historical
 * activity isn't lost on a redeploy.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { db } from '../lib/db';

type PanelSeed = {
  slug: string; name: string; vendor: string; family?: string;
  loops_max?: number; notes?: string; kb_slug?: string;
  commands?: { context: string; label: string; keystrokes: string; notes?: string }[];
  battery_loads?: { mode: 'standby' | 'alarm'; current_ma: number; source?: string }[];
};

type StandardSeed = {
  id: string; title: string; summary?: string; year?: number; authority?: string;
  clauses?: { number: string; title: string; paraphrase?: string }[];
};

type SymptomSeed = {
  slug: string; title: string; panel_filter: string | null;
  causes: { rank: number; cause: string; remediation: string }[];
};

type CategorySeed = { slug: string; label: string; family: string };

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), rel), 'utf8')) as T;
}

function seed() {
  const h = db();

  const panels      = readJson<PanelSeed[]>('data/panels.json');
  const standards   = readJson<StandardSeed[]>('data/standards.json');
  const symptoms    = readJson<SymptomSeed[]>('data/troubleshooting.json');
  const categories  = readJson<CategorySeed[]>('data/categories.json');

  const tx = h.transaction(() => {
    h.exec(`
      DELETE FROM panel_commands;
      DELETE FROM battery_loads;
      DELETE FROM panels;
      DELETE FROM standard_clauses;
      DELETE FROM standards;
      DELETE FROM symptom_causes;
      DELETE FROM symptoms;
      DELETE FROM product_categories;
    `);

    const insPanel = h.prepare(`
      INSERT INTO panels (slug, name, vendor, family, loops_max, notes, kb_slug)
      VALUES (@slug, @name, @vendor, @family, @loops_max, @notes, @kb_slug)
    `);
    const insCmd = h.prepare(`
      INSERT INTO panel_commands (panel_slug, context, label, keystrokes, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insLoad = h.prepare(`
      INSERT INTO battery_loads (panel_slug, mode, current_ma, source)
      VALUES (?, ?, ?, ?)
    `);

    for (const p of panels) {
      insPanel.run({
        slug: p.slug, name: p.name, vendor: p.vendor,
        family: p.family ?? null, loops_max: p.loops_max ?? null,
        notes: p.notes ?? null, kb_slug: p.kb_slug ?? null,
      });
      for (const c of p.commands ?? []) {
        insCmd.run(p.slug, c.context, c.label, c.keystrokes, c.notes ?? null);
      }
      for (const l of p.battery_loads ?? []) {
        insLoad.run(p.slug, l.mode, l.current_ma, l.source ?? null);
      }
    }

    const insStd = h.prepare(`
      INSERT INTO standards (id, title, summary, year, authority)
      VALUES (@id, @title, @summary, @year, @authority)
    `);
    const insClause = h.prepare(`
      INSERT INTO standard_clauses (standard_id, number, title, paraphrase)
      VALUES (?, ?, ?, ?)
    `);
    for (const s of standards) {
      insStd.run({
        id: s.id, title: s.title, summary: s.summary ?? null,
        year: s.year ?? null, authority: s.authority ?? null,
      });
      for (const c of s.clauses ?? []) {
        insClause.run(s.id, c.number, c.title, c.paraphrase ?? null);
      }
    }

    const insSym = h.prepare(`
      INSERT INTO symptoms (slug, title, panel_filter) VALUES (?, ?, ?)
    `);
    const insCause = h.prepare(`
      INSERT INTO symptom_causes (symptom_slug, cause, remediation, rank)
      VALUES (?, ?, ?, ?)
    `);
    for (const s of symptoms) {
      insSym.run(s.slug, s.title, s.panel_filter);
      for (const c of s.causes) {
        insCause.run(s.slug, c.cause, c.remediation, c.rank);
      }
    }

    const insCat = h.prepare(`
      INSERT INTO product_categories (slug, label, family) VALUES (?, ?, ?)
    `);
    for (const c of categories) insCat.run(c.slug, c.label, c.family);
  });

  tx();

  const counts = {
    panels:    (h.prepare('SELECT COUNT(*) c FROM panels').get() as { c: number }).c,
    commands:  (h.prepare('SELECT COUNT(*) c FROM panel_commands').get() as { c: number }).c,
    loads:     (h.prepare('SELECT COUNT(*) c FROM battery_loads').get() as { c: number }).c,
    standards: (h.prepare('SELECT COUNT(*) c FROM standards').get() as { c: number }).c,
    clauses:   (h.prepare('SELECT COUNT(*) c FROM standard_clauses').get() as { c: number }).c,
    symptoms:  (h.prepare('SELECT COUNT(*) c FROM symptoms').get() as { c: number }).c,
    causes:    (h.prepare('SELECT COUNT(*) c FROM symptom_causes').get() as { c: number }).c,
    categories:(h.prepare('SELECT COUNT(*) c FROM product_categories').get() as { c: number }).c,
  };
  console.log('seed complete:', counts);
}

seed();
