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
    <form onSubmit={submit} className="space-y-3" aria-busy={pending}>
      <label htmlFor="login-id" className="block space-y-1">
        <span className="block text-sm text-muted">Username or email</span>
        <input
          id="login-id" name="identifier" type="text"
          inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          autoComplete="username" enterKeyHint="next" required
          value={identifier} onChange={(e) => setIdentifier(e.target.value)}
        />
      </label>
      <label htmlFor="login-pw" className="block space-y-1">
        <span className="block text-sm text-muted">Password</span>
        <input
          id="login-pw" name="password" type="password"
          autoComplete="current-password" enterKeyHint="go" required
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p id="login-error" role="alert" className="text-warn text-sm">{error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
