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
    { v: 1, sql: V1 },
    { v: 2, sql: V2 },
    { v: 3, sql: V3 },
    { v: 4, sql: V4 },
  ];

  const apply = h.transaction((s: { v: number; sql: string }) => {
    h.exec(s.sql);
    h.prepare('INSERT INTO schema_version (version) VALUES (?)').run(s.v);
  });

  for (const step of steps) {
    if (step.v > current) apply(step);
  }
}

const V1 = `
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
`;

// V2 adds the workflow tables: users, sessions, sites, defects, service
// records, C&E matrices, brigade tests, multi-panel battery projects.
// Designed for a single trades shop (no row-level multi-tenancy here);
// add a tenants column if that ever becomes a requirement.
const V2 = `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin','tech','viewer')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    disabled_at   TEXT
  );

  CREATE TABLE sessions (
    token       TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL,
    last_seen   TEXT
  );
  CREATE INDEX idx_sessions_user ON sessions(user_id);

  CREATE TABLE sites (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    address         TEXT,
    suburb          TEXT,
    postcode        TEXT,
    contact_name    TEXT,
    contact_phone   TEXT,
    notes           TEXT,
    created_by      INTEGER REFERENCES users(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_sites_name ON sites(name);

  CREATE TABLE site_panels (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id       INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    panel_slug    TEXT NOT NULL REFERENCES panels(slug),
    label         TEXT NOT NULL,
    location      TEXT,
    install_date  TEXT,
    notes         TEXT
  );
  CREATE INDEX idx_site_panels_site ON site_panels(site_id);

  CREATE TABLE detectors (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    site_panel_id   INTEGER NOT NULL REFERENCES site_panels(id) ON DELETE CASCADE,
    address         TEXT NOT NULL,
    type            TEXT NOT NULL,
    location        TEXT,
    install_date    TEXT,
    last_tested_at  TEXT,
    replace_by      TEXT,
    notes           TEXT
  );
  CREATE INDEX idx_detectors_panel ON detectors(site_panel_id);

  CREATE TABLE defects (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id       INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    severity      TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    description   TEXT NOT NULL,
    location      TEXT,
    status        TEXT NOT NULL CHECK (status IN ('open','in_progress','resolved')) DEFAULT 'open',
    raised_at     TEXT NOT NULL DEFAULT (datetime('now')),
    raised_by     INTEGER REFERENCES users(id),
    resolved_at   TEXT,
    resolved_by   INTEGER REFERENCES users(id),
    resolution    TEXT
  );
  CREATE INDEX idx_defects_site ON defects(site_id);
  CREATE INDEX idx_defects_status ON defects(status);

  CREATE TABLE defect_photos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    defect_id     INTEGER NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
    file_path     TEXT NOT NULL,
    mime_type     TEXT,
    size_bytes    INTEGER,
    caption       TEXT,
    taken_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_defect_photos_defect ON defect_photos(defect_id);

  CREATE TABLE service_templates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    label       TEXT NOT NULL,
    frequency   TEXT NOT NULL,
    standard_id TEXT,
    items_json  TEXT NOT NULL
  );

  CREATE TABLE service_records (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id       INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    template_id   INTEGER NOT NULL REFERENCES service_templates(id),
    performed_at  TEXT NOT NULL DEFAULT (datetime('now')),
    performed_by  INTEGER REFERENCES users(id),
    results_json  TEXT NOT NULL,
    overall       TEXT NOT NULL CHECK (overall IN ('pass','partial','fail')),
    notes         TEXT
  );
  CREATE INDEX idx_service_records_site ON service_records(site_id);
  CREATE INDEX idx_service_records_when ON service_records(performed_at DESC);

  CREATE TABLE ce_matrices (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id       INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    zones_json    TEXT NOT NULL,
    outputs_json  TEXT NOT NULL,
    cells_json    TEXT NOT NULL,
    updated_by    INTEGER REFERENCES users(id),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_ce_site ON ce_matrices(site_id);

  CREATE TABLE brigade_tests (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id                  INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    performed_at             TEXT NOT NULL DEFAULT (datetime('now')),
    performed_by             INTEGER REFERENCES users(id),
    line_id                  TEXT,
    monitoring_centre        TEXT,
    ase_signal_received      INTEGER NOT NULL CHECK (ase_signal_received IN (0,1)),
    response_seconds         INTEGER,
    witnesses                TEXT,
    notes                    TEXT
  );
  CREATE INDEX idx_brigade_site ON brigade_tests(site_id);

  CREATE TABLE battery_projects (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    site_id       INTEGER REFERENCES sites(id) ON DELETE SET NULL,
    standby_hours INTEGER NOT NULL DEFAULT 24,
    alarm_minutes INTEGER NOT NULL DEFAULT 30,
    ageing_factor REAL NOT NULL DEFAULT 1.25,
    notes         TEXT,
    created_by    INTEGER REFERENCES users(id),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE battery_project_panels (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id         INTEGER NOT NULL REFERENCES battery_projects(id) ON DELETE CASCADE,
    panel_slug         TEXT NOT NULL REFERENCES panels(slug),
    label              TEXT NOT NULL,
    extra_standby_ma   REAL NOT NULL DEFAULT 0,
    extra_alarm_ma     REAL NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_bpp_project ON battery_project_panels(project_id);
`;

// V3 — adds an optional username on users so techs can sign in with a
// short handle ("Casper") instead of an email. Username is unique when
// present; nulls are still allowed for legacy rows.
const V3 = `
  ALTER TABLE users ADD COLUMN username TEXT;
  CREATE UNIQUE INDEX ux_users_username ON users(username) WHERE username IS NOT NULL;
`;

// V4 — active isolation register. Most-common liability gap in service
// work: tech disables a zone for testing, leaves site, never re-enables.
// Every isolation is logged; "active" means restored_at IS NULL. The
// site dashboard surfaces these so you cannot leave them open by accident.
const V4 = `
  CREATE TABLE isolations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id       INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    site_panel_id INTEGER REFERENCES site_panels(id) ON DELETE SET NULL,
    scope         TEXT NOT NULL CHECK (scope IN ('point','zone','loop','sounder','output','panel')),
    target        TEXT NOT NULL,
    reason        TEXT NOT NULL,
    isolated_by   INTEGER REFERENCES users(id),
    isolated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    expected_restore_at TEXT,
    restored_by   INTEGER REFERENCES users(id),
    restored_at   TEXT,
    notes         TEXT
  );
  CREATE INDEX idx_isolations_site_active ON isolations(site_id, restored_at);
  CREATE INDEX idx_isolations_active ON isolations(restored_at);
`;

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
