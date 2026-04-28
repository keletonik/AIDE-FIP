import { db } from './db';

// Lightweight in-app observability. Every server route can wrap work in
// `track()` to record the duration and outcome — visible later from the
// /admin/debug dashboard. Deliberately not a wire to a third-party APM:
// the field environment is air-gapped a lot of the time, so being able
// to read the last few hundred operations off the same SQLite file the
// app is using is worth more than fancy charts.

export type Level = 'debug' | 'info' | 'warn' | 'error';

const MAX_ROWS = 5000; // soft cap; trim_excess() keeps us under this

export function log(level: Level, source: string, message: string, meta?: unknown, durationMs?: number) {
  try {
    db().prepare(`
      INSERT INTO debug_log (level, source, message, duration_ms, meta)
      VALUES (?, ?, ?, ?, ?)
    `).run(level, source, message, durationMs ?? null, meta === undefined ? null : JSON.stringify(meta));

    // Periodic trim — only fires roughly 1 in 50 writes to keep cost low.
    if (Math.random() < 0.02) trimExcess();
  } catch {
    // The debugger must never crash the request path. If SQLite is
    // momentarily locked we just drop this entry on the floor.
  }
}

export function debug(source: string, message: string, meta?: unknown) { log('debug', source, message, meta); }
export function info (source: string, message: string, meta?: unknown) { log('info',  source, message, meta); }
export function warn (source: string, message: string, meta?: unknown) { log('warn',  source, message, meta); }
export function error(source: string, message: string, meta?: unknown) { log('error', source, message, meta); }

export async function track<T>(source: string, label: string, fn: () => Promise<T> | T, meta?: unknown): Promise<T> {
  const start = performance.now();
  try {
    const out = await fn();
    log('info', source, label, meta, +(performance.now() - start).toFixed(2));
    return out;
  } catch (err: unknown) {
    log('error', source, `${label} threw`, {
      meta,
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
    }, +(performance.now() - start).toFixed(2));
    throw err;
  }
}

export type DebugRow = {
  id: number; ts: string; level: Level; source: string | null;
  message: string; duration_ms: number | null; meta: string | null;
};

export function recentDebug(opts: { limit?: number; level?: Level | 'all' } = {}): DebugRow[] {
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);
  if (opts.level && opts.level !== 'all') {
    return db().prepare(`
      SELECT id, ts, level, source, message, duration_ms, meta
      FROM debug_log WHERE level = ? ORDER BY id DESC LIMIT ?
    `).all(opts.level, limit) as DebugRow[];
  }
  return db().prepare(`
    SELECT id, ts, level, source, message, duration_ms, meta
    FROM debug_log ORDER BY id DESC LIMIT ?
  `).all(limit) as DebugRow[];
}

export function debugSummary() {
  return db().prepare(`
    SELECT
      level,
      COUNT(*)        AS count,
      ROUND(AVG(duration_ms), 1) AS avg_ms,
      ROUND(MAX(duration_ms), 1) AS max_ms,
      MAX(ts)         AS last_seen
    FROM debug_log
    GROUP BY level
    ORDER BY CASE level WHEN 'error' THEN 1 WHEN 'warn' THEN 2 WHEN 'info' THEN 3 ELSE 4 END
  `).all() as { level: Level; count: number; avg_ms: number | null; max_ms: number | null; last_seen: string }[];
}

export function clearDebug() {
  db().exec('DELETE FROM debug_log');
}

function trimExcess() {
  const n = (db().prepare('SELECT COUNT(*) c FROM debug_log').get() as { c: number }).c;
  if (n <= MAX_ROWS) return;
  db().prepare(`
    DELETE FROM debug_log
    WHERE id IN (SELECT id FROM debug_log ORDER BY id ASC LIMIT ?)
  `).run(n - MAX_ROWS);
}
