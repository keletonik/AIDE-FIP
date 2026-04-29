import Link from 'next/link';
import { headers } from 'next/headers';
import { isAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Synthetic Request so isAdmin() can read x-admin-key header / ?key= via
  // current request headers.
  const h = await headers();
  const url = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host') ?? 'localhost'}${h.get('x-invoke-path') ?? ''}${h.get('x-invoke-query') ? `?${h.get('x-invoke-query')}` : ''}`;
  const ok = await isAdmin(new Request(url, { headers: h }));
  if (!ok) {
    return (
      <div className="card p-6 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold">Locked</h1>
        <p className="text-muted text-sm mt-2">
          Admin pages require an admin session or the <code>ADMIN_KEY</code> break-glass key
          (append <code>?key=&lt;ADMIN_KEY&gt;</code> to the URL or set the
          <code> x-admin-key</code> header).
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Admin">
        <Link className="btn" href="/admin/audit">Audit</Link>
        <Link className="btn" href="/admin/debug">Debug</Link>
        <Link className="btn" href="/admin/health">Health</Link>
        <Link className="btn" href="/admin/users">Users</Link>
        <Link className="btn" href="/brand">Brand</Link>
      </nav>
      {children}
    </div>
  );
}
