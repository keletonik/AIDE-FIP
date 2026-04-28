import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { db, one, run } from './db';
import { hashPassword, verifyPassword } from './passwords';

// Session-cookie auth, server-side only. Cookie holds an opaque token;
// the row in `sessions` carries the user link and expiry. Sessions are
// trimmed lazily in `currentUser()`.

export const SESSION_COOKIE = 'aide_sess';
const SESSION_DAYS = 30;

export type Role = 'admin' | 'tech' | 'viewer';

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
  created_at: string;
  disabled_at: string | null;
};

type UserRow = User & { password_hash: string };

export function userCount(): number {
  return (one<{ c: number }>('SELECT COUNT(*) c FROM users')?.c) ?? 0;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return one<UserRow>(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
}

export function createUser(email: string, password: string, name: string, role: Role): User {
  if (findUserByEmail(email)) throw new Error('email already registered');
  const hash = hashPassword(password);
  const info = run(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
    [email.toLowerCase(), hash, name, role],
  );
  return one<User>(`SELECT id,email,name,role,created_at,disabled_at FROM users WHERE id = ?`, [info.lastInsertRowid as number])!;
}

export function authenticate(email: string, password: string): User | null {
  const u = findUserByEmail(email);
  if (!u || u.disabled_at) return null;
  if (!verifyPassword(password, u.password_hash)) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at, disabled_at: u.disabled_at };
}

export function startSession(userId: number): { token: string; expires: Date } {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  run(
    `INSERT INTO sessions (token, user_id, expires_at, last_seen) VALUES (?, ?, ?, datetime('now'))`,
    [token, userId, expires.toISOString()],
  );
  return { token, expires };
}

export function endSession(token: string) {
  run(`DELETE FROM sessions WHERE token = ?`, [token]);
}

export async function currentUser(): Promise<User | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = one<UserRow & { expires_at: string }>(`
    SELECT u.*, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `, [token]);

  if (!row) return null;
  if (row.disabled_at) return null;

  // Touch last_seen at most once a minute to avoid hot writes.
  if (Math.random() < 0.05) {
    db().prepare(`UPDATE sessions SET last_seen = datetime('now') WHERE token = ?`).run(token);
  }

  return { id: row.id, email: row.email, name: row.name, role: row.role, created_at: row.created_at, disabled_at: row.disabled_at };
}

export async function requireUser(roles?: Role[]): Promise<User> {
  const u = await currentUser();
  if (!u) throw new AuthRequired();
  if (roles && !roles.includes(u.role)) throw new Forbidden();
  return u;
}

export class AuthRequired extends Error { constructor() { super('auth required'); } }
export class Forbidden     extends Error { constructor() { super('forbidden'); } }

export function listUsers(): User[] {
  return db().prepare(`SELECT id,email,name,role,created_at,disabled_at FROM users ORDER BY created_at`).all() as User[];
}

export function pruneExpiredSessions() {
  run(`DELETE FROM sessions WHERE expires_at <= datetime('now')`);
}
