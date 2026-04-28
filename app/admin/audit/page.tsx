import { isAdmin } from '@/lib/admin';
import { auditSummary, recentAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit log' };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const sp = await searchParams;
  // Pass a synthetic request so isAdmin() can pick up ?key= as well as
  // the request header. Either path is acceptable in practice.
  const req = new Request(`http://x?${sp.key ? `key=${encodeURIComponent(sp.key)}` : ''}`);
  if (!(await isAdmin(req))) {
    return <Locked />;
  }

  const summary = auditSummary();
  const rows = recentAudit(300);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Audit log</h1>
      <p className="text-muted text-sm">User-meaningful actions captured server-side. Tenant-readable: never log credentials, only what they did.</p>

      <section className="card p-3">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">By action</h2>
        <table>
          <thead><tr><th>Action</th><th>Count</th><th>Last seen</th></tr></thead>
          <tbody>
            {summary.map(s => (
              <tr key={s.action}>
                <td className="text-head">{s.action}</td>
                <td>{s.count}</td>
                <td className="text-muted text-sm">{s.last_seen}</td>
              </tr>
            ))}
            {summary.length === 0 && <tr><td colSpan={3} className="text-muted">No activity yet.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card p-3 overflow-auto">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Recent (last 300)</h2>
        <table>
          <thead><tr><th>When</th><th>Action</th><th>Target</th><th>Payload</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="text-muted text-xs whitespace-nowrap">{r.ts}</td>
                <td className="text-head">{r.action}</td>
                <td>{r.target ?? <span className="text-muted">—</span>}</td>
                <td className="text-xs"><code className="text-muted">{r.payload ?? ''}</code></td>
                <td className="text-muted text-xs">{r.ip ?? ''}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-muted">No entries.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Locked() {
  return (
    <div className="card p-6 max-w-md">
      <h1 className="text-lg font-semibold text-head">Locked</h1>
      <p className="text-muted text-sm mt-2">Append <code className="kbd">?key=&lt;ADMIN_KEY&gt;</code> to view.</p>
    </div>
  );
}
