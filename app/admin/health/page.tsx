import { isAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Health' };

type Stat = { label: string; value: string | number };

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const sp = await searchParams;
  const req = new Request(`http://x?${sp.key ? `key=${encodeURIComponent(sp.key)}` : ''}`);
  if (!(await isAdmin(req))) {
    return (
      <div className="card p-6 max-w-md">
        <h1 className="text-lg font-semibold text-head">Locked</h1>
        <p className="text-muted text-sm mt-2">Append <code className="kbd">?key=&lt;ADMIN_KEY&gt;</code>.</p>
      </div>
    );
  }

  const h = db();
  const tables = ['panels','panel_commands','battery_loads','standards','standard_clauses','symptoms','symptom_causes','product_categories','audit_log','debug_log'];
  const counts: Stat[] = tables.map(t => ({
    label: t,
    value: (h.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c,
  }));
  const journalMode = (h.pragma('journal_mode', { simple: true }) as string) ?? '?';
  const sver = (h.prepare('SELECT MAX(version) v FROM schema_version').get() as { v: number }).v;
  const meminfo = process.memoryUsage();

  const env: Stat[] = [
    { label: 'node', value: process.version },
    { label: 'pid', value: process.pid },
    { label: 'uptime (s)', value: Math.round(process.uptime()) },
    { label: 'rss (MB)', value: (meminfo.rss / 1024 / 1024).toFixed(1) },
    { label: 'heap used (MB)', value: (meminfo.heapUsed / 1024 / 1024).toFixed(1) },
    { label: 'sqlite journal', value: journalMode },
    { label: 'schema version', value: sver },
    { label: 'KB base', value: process.env.NEXT_PUBLIC_KB_URL ?? '(default)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Health</h1>

      <section className="card p-3">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Runtime</h2>
        <Grid items={env} />
      </section>

      <section className="card p-3">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Row counts</h2>
        <Grid items={counts} />
      </section>
    </div>
  );
}

function Grid({ items }: { items: Stat[] }) {
  return (
    <dl className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
      {items.map(i => (
        <div key={i.label} className="border border-line rounded-md p-2">
          <dt className="text-xs uppercase tracking-wider text-muted">{i.label}</dt>
          <dd className="text-head font-mono">{String(i.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
