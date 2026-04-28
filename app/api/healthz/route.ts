import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// Healthcheck for Replit Deployments / load balancers / uptime monitors.
// Cheap and synchronous: a single SQLite ping. Intentionally not gated
// behind auth — Replit's healthcheck pings are anonymous.
export async function GET() {
  const started = performance.now();
  let dbOk = false;
  let schemaVersion: number | null = null;
  try {
    const row = db().prepare(`SELECT MAX(version) AS v FROM schema_version`).get() as { v: number | null };
    schemaVersion = row.v;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? 200 : 503;
  return NextResponse.json(
    {
      ok: dbOk,
      app: 'aide-fip',
      schema: schemaVersion,
      uptime_s: Math.round(process.uptime()),
      latency_ms: +(performance.now() - started).toFixed(2),
      ts: new Date().toISOString(),
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
