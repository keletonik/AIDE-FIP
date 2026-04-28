/* Create or update a user from the command line.
 *
 *   npx tsx scripts/create-user.ts <username> <password> [--admin] [--name "Full Name"] [--email someone@x]
 *
 * Useful for bootstrapping the first admin without going through the
 * register page, and for resetting a forgotten password without
 * touching SQLite by hand.
 */
import { createUser, findUserByEmail, type Role } from '../lib/auth';
import { hashPassword } from '../lib/passwords';
import { db, run } from '../lib/db';

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

const username = process.argv[2];
const password = process.argv[3];
if (!username || !password) {
  console.error('usage: tsx scripts/create-user.ts <username> <password> [--admin] [--tech] [--viewer] [--name "Full Name"] [--email user@example.com]');
  process.exit(2);
}

const role: Role = process.argv.includes('--admin') ? 'admin'
  : process.argv.includes('--viewer') ? 'viewer' : 'tech';
const name = arg('--name') || username;
const email = arg('--email') || `${username.toLowerCase()}@aide-fip.local`;

const h = db();
const existing = h.prepare(`SELECT id, email FROM users WHERE LOWER(username) = LOWER(?)`).get(username) as { id: number; email: string } | undefined
  ?? findUserByEmail(email);

if (existing) {
  // Update password + role + name in place. Idempotent re-runs are fine.
  const hash = hashPassword(password);
  run(
    `UPDATE users SET password_hash = ?, role = ?, name = ?, username = ?, disabled_at = NULL WHERE id = ?`,
    [hash, role, name, username, (existing as { id: number }).id],
  );
  console.log(`updated user #${(existing as { id: number }).id} ${username} (${role})`);
} else {
  const u = createUser({ email, username, password, name, role });
  console.log(`created user #${u.id} ${u.username} <${u.email}> (${u.role})`);
}
