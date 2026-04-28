import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Single SQLite handle reused across the process. Replit deployments are a
// single Node container so a process-local connection is the right call —
// no pool, no connection juggling. WAL mode keeps reads non-blocking while
// the seeder writes during build.

let _db: Database.Database | null = null;

function dbPath() {
  return resolve(process.cwd(), process.env.AIDE_DB_PATH || './data/aide.db');
}

export function db(): Database.Database {
  if (_db) return _db;

  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });

  const handle = new Database(path);
  handle.pragma('journal_mode = WAL');
  handle.pragma('synchronous = NORMAL');
  handle.pragma('foreign_keys = ON');
  handle.pragma('busy_timeout = 5000');

  migrate(handle);
  _db = handle;
  return handle;
}

// Schema migrations are forward-only and idempotent. Each block is wrapped
// in a transaction so a half-applied schema can never wedge the build.
function migrate(h: Database.Database) {
  h.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const current = (h.prepare('SELECT MAX(version) AS v FROM schema_version').get() as { v: number | null }).v ?? 0;

  const steps: Array<{ v: number; sql: string }> = [
    {
      v: 1,
      sql: `
        CREATE TABLE panels (
          slug         TEXT PRIMARY KEY,
          name         TEXT NOT NULL,
          vendor       TEXT NOT NULL,
          family       TEXT,
          loops_max    INTEGER,
          notes        TEXT,
          kb_slug      TEXT
        );

        CREATE TABLE panel_commands (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          panel_slug   TEXT NOT NULL REFERENCES panels(slug) ON DELETE CASCADE,
          context      TEXT NOT NULL,
          label        TEXT NOT NULL,
          keystrokes   TEXT NOT NULL,
          notes        TEXT
        );
        CREATE INDEX idx_pc_panel ON panel_commands(panel_slug);

        CREATE TABLE battery_loads (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          panel_slug   TEXT NOT NULL REFERENCES panels(slug) ON DELETE CASCADE,
          mode         TEXT NOT NULL CHECK (mode IN ('standby','alarm')),
          current_ma   REAL NOT NULL,
          source       TEXT
        );
        CREATE INDEX idx_bl_panel ON battery_loads(panel_slug);

        CREATE TABLE standards (
          id           TEXT PRIMARY KEY,
          title        TEXT NOT NULL,
          summary      TEXT,
          year         INTEGER,
          authority    TEXT
        );

        CREATE TABLE standard_clauses (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          standard_id     TEXT NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
          number          TEXT NOT NULL,
          title           TEXT NOT NULL,
          paraphrase      TEXT,
          UNIQUE(standard_id, number)
        );
        CREATE INDEX idx_clause_std ON standard_clauses(standard_id);

        CREATE TABLE symptoms (
          slug         TEXT PRIMARY KEY,
          title        TEXT NOT NULL,
          panel_filter TEXT
        );

        CREATE TABLE symptom_causes (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          symptom_slug TEXT NOT NULL REFERENCES symptoms(slug) ON DELETE CASCADE,
          cause        TEXT NOT NULL,
          remediation  TEXT NOT NULL,
          rank         INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX idx_sc_symptom ON symptom_causes(symptom_slug);

        CREATE TABLE product_categories (
          slug         TEXT PRIMARY KEY,
          label        TEXT NOT NULL,
          family       TEXT NOT NULL
        );

        CREATE TABLE audit_log (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          ts           TEXT NOT NULL DEFAULT (datetime('now')),
          actor        TEXT,
          action       TEXT NOT NULL,
          target       TEXT,
          payload      TEXT,
          ip           TEXT,
          user_agent   TEXT
        );
        CREATE INDEX idx_audit_ts ON audit_log(ts DESC);
        CREATE INDEX idx_audit_action ON audit_log(action);

        CREATE TABLE debug_log (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          ts           TEXT NOT NULL DEFAULT (datetime('now')),
          level        TEXT NOT NULL,
          source       TEXT,
          message      TEXT NOT NULL,
          duration_ms  REAL,
          meta         TEXT
        );
        CREATE INDEX idx_debug_ts ON debug_log(ts DESC);
        CREATE INDEX idx_debug_level ON debug_log(level);
      `,
    },
  ];

  const apply = h.transaction((s: { v: number; sql: string }) => {
    h.exec(s.sql);
    h.prepare('INSERT INTO schema_version (version) VALUES (?)').run(s.v);
  });

  for (const step of steps) {
    if (step.v > current) apply(step);
  }
}

// Convenience wrappers used across server components and route handlers.
export function all<T = unknown>(sql: string, params: unknown[] = []): T[] {
  return db().prepare(sql).all(...(params as [])) as T[];
}
export function one<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
  return db().prepare(sql).get(...(params as [])) as T | undefined;
}
export function run(sql: string, params: unknown[] = []) {
  return db().prepare(sql).run(...(params as []));
}
