import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 text-sm">
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
