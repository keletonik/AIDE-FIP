/* Restore from a backup archive produced by `npm run db:backup`.
 *
 *   npm run db:restore <path-to-backup.tar.gz>
 *
 * Stops short of overwriting if the live DB hasn't been moved aside —
 * pass --force to overwrite anyway. Always takes a safety snapshot of
 * the current DB before restoring so a wrong-archive mistake is
 * recoverable.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, copyFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const archive = process.argv[2];
const force = process.argv.includes('--force');

if (!archive) {
  console.error('usage: tsx scripts/restore.ts <backup.tar.gz> [--force]');
  process.exit(2);
}
if (!existsSync(archive)) {
  console.error(`no such file: ${archive}`);
  process.exit(1);
}

const DB_PATH      = resolve(process.cwd(), process.env.AIDE_DB_PATH || './data/aide.db');
const UPLOADS_DIR  = resolve(process.cwd(), './data/uploads');
const SAFETY_DIR   = resolve(process.cwd(), './data/backups/.safety');
const RESTORE_TMP  = resolve(process.cwd(), './data/backups/.restore-tmp');

if (existsSync(DB_PATH) && !force) {
  // Safety snapshot first. Names by ISO timestamp so they're sortable.
  mkdirSync(SAFETY_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safe = join(SAFETY_DIR, `pre-restore-${stamp}.db`);
  copyFileSync(DB_PATH, safe);
  console.log(`safety copy of current DB -> ${safe}`);
}

// Extract to a clean tmp dir.
rmSync(RESTORE_TMP, { recursive: true, force: true });
mkdirSync(RESTORE_TMP, { recursive: true });

const tar = spawnSync('tar', ['-xzf', archive, '-C', RESTORE_TMP]);
if (tar.status !== 0) {
  console.error('tar extract failed:', tar.stderr.toString());
  process.exit(1);
}

// The archive contains a single _staging-<ts> directory at top level.
const top = readdirSync(RESTORE_TMP);
if (top.length !== 1) {
  console.error(`unexpected archive shape — top level has ${top.length} entries:`, top);
  process.exit(1);
}
const root = join(RESTORE_TMP, top[0]);
const restoredDb = join(root, 'aide.db');
const restoredUploads = join(root, 'uploads');

if (!existsSync(restoredDb)) {
  console.error(`archive missing aide.db at ${restoredDb}`);
  process.exit(1);
}

// Stop using the live SQLite handle (the consumer of this script must not
// have the app running). Move-in-place.
mkdirSync(resolve(process.cwd(), './data'), { recursive: true });

// CRITICAL: drop WAL + SHM sidecars before swapping the DB file in.
// Without this, SQLite re-applies the old WAL on first open and the
// restore looks empty. Discovered this the hard way during a roundtrip
// test — the recovered DB file was correct on disk, but the running
// app re-applied the previous session's WAL and reverted everything.
for (const sidecar of ['-wal', '-shm', '-journal']) {
  const path = DB_PATH + sidecar;
  if (existsSync(path)) rmSync(path);
}

renameSync(restoredDb, DB_PATH);
console.log(`db restored -> ${DB_PATH} (${(statSync(DB_PATH).size / 1024).toFixed(1)} KB)`);

if (existsSync(restoredUploads)) {
  // Replace uploads/ wholesale.
  if (existsSync(UPLOADS_DIR)) rmSync(UPLOADS_DIR, { recursive: true, force: true });
  renameSync(restoredUploads, UPLOADS_DIR);
  console.log(`uploads restored -> ${UPLOADS_DIR}`);
}

rmSync(RESTORE_TMP, { recursive: true, force: true });
console.log(`restore complete from ${basename(archive)}`);
console.log('restart the app to pick up the restored database.');
