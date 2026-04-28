import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Storage format: scrypt$N$r$p$saltHex$hashHex
// N=16384, r=8, p=1 are the OWASP-recommended baseline scrypt parameters
// for interactive logins. Tunable here if the box gets faster or slower.

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const n = parseInt(nStr, 10), rr = parseInt(rStr, 10), pp = parseInt(pStr, 10);
  if (!n || !rr || !pp) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const got = scryptSync(plain, salt, expected.length, { N: n, r: rr, p: pp });
    return got.length === expected.length && timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}
