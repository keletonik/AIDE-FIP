import { mkdirSync, createReadStream, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';

// Files live under ./data/uploads/<bucket>/<id>/<token><ext>. Sticking to
// the data/ tree means everything an admin needs to back up is under one
// folder (DB + uploads), which suits Replit volume snapshots.

const ROOT = resolve(process.cwd(), 'data', 'uploads');

export function uploadsDir(bucket: string, key: string) {
  const dir = join(ROOT, bucket, key);
  mkdirSync(dir, { recursive: true });
  return dir;
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export async function saveImage(bucket: string, key: string, file: File): Promise<{ path: string; size: number; mime: string }> {
  if (!ALLOWED_MIME.has(file.type)) throw new Error(`unsupported type: ${file.type || 'unknown'}`);
  const dir = uploadsDir(bucket, key);
  const ext = extname(file.name) || mimeToExt(file.type);
  const name = `${randomBytes(8).toString('hex')}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 12 * 1024 * 1024) throw new Error('file too large (12 MB max)');
  const fullPath = join(dir, name);
  writeFileSync(fullPath, buf);
  return { path: relativeFromCwd(fullPath), size: buf.length, mime: file.type };
}

function relativeFromCwd(p: string) {
  return p.replace(process.cwd() + '/', '');
}

function mimeToExt(m: string) {
  switch (m) {
    case 'image/jpeg': return '.jpg';
    case 'image/png':  return '.png';
    case 'image/webp': return '.webp';
    case 'image/heic': return '.heic';
    case 'image/heif': return '.heif';
    default: return '';
  }
}

export function readUpload(relPath: string) {
  const safe = resolve(process.cwd(), relPath);
  if (!safe.startsWith(ROOT)) throw new Error('path escapes uploads root');
  if (!existsSync(safe)) return null;
  return { stream: createReadStream(safe), size: statSync(safe).size };
}
