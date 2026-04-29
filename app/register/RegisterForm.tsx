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
    <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
      <label htmlFor="reg-name" className="block space-y-1">
        <span className="block text-sm text-muted">Name</span>
        <input id="reg-name" name="name" type="text" autoComplete="name" enterKeyHint="next" required
          value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label htmlFor="reg-username" className="block space-y-1">
        <span className="block text-sm text-muted">Username (optional, used for sign-in)</span>
        <input id="reg-username" name="username" type="text"
          inputMode="text" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          autoComplete="username" enterKeyHint="next"
          pattern="[A-Za-z0-9._-]{2,40}" title="Letters, digits, dot/underscore/hyphen, 2-40 chars"
          value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label htmlFor="reg-email" className="block space-y-1">
        <span className="block text-sm text-muted">Email</span>
        <input id="reg-email" name="email" type="email"
          inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          autoComplete="email" enterKeyHint="next" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label htmlFor="reg-pw" className="block space-y-1">
        <span className="block text-sm text-muted">Password (min 12 chars)</span>
        <input id="reg-pw" name="password" type="password"
          autoComplete="new-password" enterKeyHint="go" minLength={12} maxLength={200} required
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'reg-error' : undefined}
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {!bootstrap && (
        <label htmlFor="reg-role" className="block space-y-1">
          <span className="block text-sm text-muted">Role</span>
          <select id="reg-role" name="role" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'tech' | 'viewer')}>
            <option value="tech">Tech</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      )}
      {error && <p id="reg-error" role="alert" className="text-warn text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
        {pending ? 'Creating…' : (bootstrap ? 'Create admin' : 'Create user')}
      </button>
    </form>
  );
}
