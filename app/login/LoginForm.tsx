'use client';

import { useState } from 'react';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || 'login failed');
        return;
      }
      window.location.href = '/sites';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Username or email</span>
        <input autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="block text-sm text-muted">Password</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="text-warn text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
