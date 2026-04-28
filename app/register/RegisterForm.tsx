'use client';

import { useState } from 'react';

export function RegisterForm({ bootstrap }: { bootstrap: boolean }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'tech' | 'viewer'>('tech');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email, password, name,
          username: username || undefined,
          role: bootstrap ? undefined : role,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || 'failed');
        return;
      }
      window.location.href = bootstrap ? '/sites' : '/admin/users';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Username (optional, used for sign-in)</span>
        <input autoComplete="username" pattern="[A-Za-z0-9._-]{2,40}" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Email</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Password (min 8 chars)</span>
        <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {!bootstrap && (
        <label className="block space-y-1">
          <span className="block text-sm text-muted">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'tech' | 'viewer')}>
            <option value="tech">Tech</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      )}
      {error && <p className="text-warn text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
        {pending ? 'Creating…' : (bootstrap ? 'Create admin' : 'Create user')}
      </button>
    </form>
  );
}
