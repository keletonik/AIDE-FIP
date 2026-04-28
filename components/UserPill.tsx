'use client';

import Link from 'next/link';
import type { User } from '@/lib/auth';

export function UserPill({ user }: { user: User | null }) {
  if (!user) {
    return <Link href="/login" className="btn">Sign in</Link>;
  }
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted hidden sm:inline">{user.username || user.name}</span>
      <span className="tag">{user.role}</span>
      <button onClick={logout} className="btn">Sign out</button>
    </div>
  );
}
