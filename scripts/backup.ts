/* SQLite backup → ./data/backups/<iso-ts>.tar.gz
 *
 * Includes: aide.db (live snapshot), data/uploads/ (photos).
 * Excludes: WAL / SHM sidecars (the snapshot is consistent on its own).
 *
 * Uses better-sqlite3's online .backup() so the app can keep serving
 * traffic while it runs. Restore with `npm run db:restore <file>`.
 *
 *   npm run db:backup
 */
import Database from 'better-sqlite3';
import { mkdirSync, existsSync, statSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DB_PATH       = resolve(process.cwd(), process.env.AIDE_DB_PATH || './data/aide.db');
const BACKUPS_DIR   = resolve(process.cwd(), './data/backups');
const UPLOADS_DIR   = resolve(process.cwd(), './data/uploads');

async function main() {
  if (!existsSync(DB_PATH)) {
    console.error(`no database at ${DB_PATH} — nothing to back up`);
    process.exit(1);
  }

  mkdirSync(BACKUPS_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const stagingDir = join(BACKUPS_DIR, `_staging-${ts}`);
  const dbCopyPath = join(stagingDir, 'aide.db');
  const archivePath = join(BACKUPS_DIR, `${ts}.tar.gz`);

  mkdirSync(stagingDir, { recursive: true });

  console.log(`snapshotting database -> ${dbCopyPath}`);
  const live = new Database(DB_PATH, { readonly: true });
  await live.backup(dbCopyPath);
  live.close();

  const dbBytes = statSync(dbCopyPath).size;
  console.log(`  db snapshot: ${(dbBytes / 1024).toFixed(1)} KB`);

  // Copy uploads into staging then tar the whole staging dir. Using system
  // tar — it's in replit.nix and every Replit container has it.
  if (existsSync(UPLOADS_DIR)) {
    const cp = spawnSync('cp', ['-r', UPLOADS_DIR, join(stagingDir, 'uploads')]);
    if (cp.status !== 0) {
      console.error('failed to copy uploads:', cp.stderr.toString());
      process.exit(1);
    }
  }

  const tar = spawnSync('tar', ['-czf', archivePath, '-C', BACKUPS_DIR, `_staging-${ts}`]);
  if (tar.status !== 0) {
    console.error('tar failed:', tar.stderr.toString());
    process.exit(1);
  }

  rmSync(stagingDir, { recursive: true, force: true });

  const archiveBytes = statSync(archivePath).size;
  console.log(`backup written: ${archivePath} (${(archiveBytes / 1024).toFixed(1)} KB)`);
  console.log(`restore with:    npm run db:restore "${archivePath}"`);
}

main().catch((e) => {
  console.error('backup failed:', e);
  process.exit(1);
});
