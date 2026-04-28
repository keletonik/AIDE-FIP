import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser, listUsers } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Users' };

export default async function UsersPage() {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role !== 'admin') redirect('/sites');

  const users = listUsers();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-head">Users</h1>
        <Link href="/register" className="btn btn-primary">+ Add user</Link>
      </div>
      <table>
        <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Created</th><th>Status</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="text-head">{u.email}</td>
              <td>{u.name}</td>
              <td><span className="tag">{u.role}</span></td>
              <td className="text-muted text-xs">{u.created_at}</td>
              <td>{u.disabled_at ? <span className="tag tag-warn">disabled</span> : <span className="tag tag-ok">active</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
