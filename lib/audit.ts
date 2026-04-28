import { db } from './db';
import { headers } from 'next/headers';

// Audit log captures user-meaningful actions (calculation submitted,
// troubleshooting graph queried, KB link followed). Server-side only —
// these rows are what a tenant or auditor would expect to be able to
// review long after the fact.

export type AuditEntry = {
  actor?: string | null;
  action: string;
  target?: string | null;
  payload?: unknown;
};

export async function audit(entry: AuditEntry) {
  let ip: string | null = null;
  let ua: string | null = null;
  try {
    const h = await headers();
    ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || null;
    ua = h.get('user-agent');
  } catch {
    // Called outside a request scope — that's fine, we just won't capture
    // the network metadata.
  }

  db().prepare(`
    INSERT INTO audit_log (actor, action, target, payload, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.actor ?? null,
    entry.action,
    entry.target ?? null,
    entry.payload === undefined ? null : JSON.stringify(entry.payload),
    ip,
    ua,
  );
}

export type AuditRow = {
  id: number; ts: string; actor: string | null; action: string;
  target: string | null; payload: string | null; ip: string | null; user_agent: string | null;
};

export function recentAudit(limit = 200): AuditRow[] {
  return db().prepare(`
    SELECT id, ts, actor, action, target, payload, ip, user_agent
    FROM audit_log ORDER BY id DESC LIMIT ?
  `).all(limit) as AuditRow[];
}

export function auditSummary() {
  return db().prepare(`
    SELECT action, COUNT(*) as count, MAX(ts) as last_seen
    FROM audit_log
    GROUP BY action
    ORDER BY count DESC
  `).all() as { action: string; count: number; last_seen: string }[];
}
