import { isAdmin } from '@/lib/admin';
import { debugSummary, recentDebug, type Level } from '@/lib/debugger';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Debug log' };

const LEVELS: (Level | 'all')[] = ['all', 'error', 'warn', 'info', 'debug'];

export default async function DebugPage({
  searchParams,
}: { searchParams: Promise<{ key?: string; level?: string; limit?: string }> }) {
  const sp = await searchParams;
  const req = new Request(`http://x?${sp.key ? `key=${encodeURIComponent(sp.key)}` : ''}`);
  if (!(await isAdmin(req))) return <Locked />;

  const level = (LEVELS.includes(sp.level as Level) ? (sp.level as Level) : 'all');
  const limit = Math.min(Math.max(parseInt(sp.limit ?? '300', 10) || 300, 50), 1000);

  const summary = debugSummary();
  const rows = recentDebug({ level, limit });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Debug log</h1>
      <p className="text-muted text-sm">In-process observability — last few hundred operations, durations and errors. Reads off the same SQLite file the app writes; nothing leaves the box.</p>

      <section className="card p-3">
        <h2 className="text-sm uppercase tracking-wide text-muted mb-2">Summary</h2>
        <table>
          <thead><tr><th>Level</th><th>Count</th><th>Avg ms</th><th>Max ms</th><th>Last</th></tr></thead>
          <tbody>
            {summary.map(s => (
              <tr key={s.level}>
                <td><LevelTag level={s.level} /></td>
                <td>{s.count}</td>
                <td>{s.avg_ms ?? '—'}</td>
                <td>{s.max_ms ?? '—'}</td>
                <td className="text-muted text-xs">{s.last_seen}</td>
              </tr>
            ))}
            {summary.length === 0 && <tr><td colSpan={5} className="text-muted">No entries yet.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card p-3 overflow-auto">
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-sm uppercase tracking-wide text-muted">Recent</h2>
          <div className="ml-auto flex gap-1 text-xs">
            {LEVELS.map(l => (
              <a key={l}
                 href={`?key=${encodeURIComponent(sp.key ?? '')}&level=${l}&limit=${limit}`}
                 className={`px-2 py-1 rounded-md no-underline ${level === l ? 'bg-line text-head' : 'text-muted'}`}>
                {l}
              </a>
            ))}
          </div>
        </div>

        <table>
          <thead><tr><th>When</th><th>Lvl</th><th>Source</th><th>Message</th><th>Dur</th><th>Meta</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="text-muted text-xs whitespace-nowrap">{r.ts}</td>
                <td><LevelTag level={r.level} /></td>
                <td className="text-head">{r.source}</td>
                <td className="text-body">{r.message}</td>
                <td className="text-muted text-xs">{r.duration_ms != null ? `${r.duration_ms} ms` : '—'}</td>
                <td className="text-xs"><code className="text-muted break-all">{r.meta ?? ''}</code></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-muted">Nothing matches that filter.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function LevelTag({ level }: { level: Level }) {
  const cls =
    level === 'error' ? 'tag tag-warn'
    : level === 'warn' ? 'tag tag-amber'
    : level === 'info' ? 'tag tag-ok'
    : 'tag';
  return <span className={cls}>{level}</span>;
}

function Locked() {
  return (
    <div className="card p-6 max-w-md">
      <h1 className="text-lg font-semibold text-head">Locked</h1>
      <p className="text-muted text-sm mt-2">Append <code className="kbd">?key=&lt;ADMIN_KEY&gt;</code> to view.</p>
    </div>
  );
}
