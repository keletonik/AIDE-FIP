/* In-tree code auditor. Run with: npm run audit:check
 *
 * Checks the codebase for shape rules we want to enforce. Not a linter
 * replacement — these are project-specific invariants that ESLint can't
 * easily express:
 *
 *   1. No third-party telemetry (matomo, segment, ga, mixpanel, sentry).
 *   2. No leakage of the admin key into client code.
 *   3. Every server-side fetch to KB goes through lib/kb.ts.
 *   4. No console.log in app/ or lib/ — use the in-app debugger instead.
 *
 * Exits non-zero if any rule fires.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'lib', 'components', 'scripts'];
const IGNORE = /node_modules|\.next|\.git|dist|out/;

type Finding = { file: string; line: number; rule: string; detail: string };

const rules: { name: string; test: (src: string, file: string) => Finding[] }[] = [
  {
    name: 'no-third-party-telemetry',
    test: (src, file) => {
      // The audit script defines the rule's own pattern — exempt it.
      if (file === 'scripts/run-audit.ts') return [];
      const found: Finding[] = [];
      const banned = /\b(matomo|segment\.io|google-analytics|mixpanel|sentry|posthog)\b/i;
      src.split('\n').forEach((line, i) => {
        if (banned.test(line)) found.push({ file, line: i + 1, rule: 'no-third-party-telemetry', detail: line.trim() });
      });
      return found;
    },
  },
  {
    name: 'no-admin-key-on-client',
    test: (src, file) => {
      if (!file.includes('app/') && !file.includes('components/')) return [];
      const found: Finding[] = [];
      const isClient = /^['"]use client['"]/m.test(src);
      if (!isClient) return [];
      src.split('\n').forEach((line, i) => {
        if (/ADMIN_KEY/.test(line)) found.push({ file, line: i + 1, rule: 'no-admin-key-on-client', detail: line.trim() });
      });
      return found;
    },
  },
  {
    name: 'kb-via-lib',
    test: (src, file) => {
      if (file === 'lib/kb.ts') return [];
      const found: Finding[] = [];
      src.split('\n').forEach((line, i) => {
        if (/keletonik\.github\.io/.test(line) && !/lib\/kb/.test(line)) {
          found.push({ file, line: i + 1, rule: 'kb-via-lib', detail: line.trim() });
        }
      });
      return found;
    },
  },
  {
    name: 'no-console-log',
    test: (src, file) => {
      // Allow console in scripts/ — they're CLI output.
      if (file.startsWith('scripts/')) return [];
      const found: Finding[] = [];
      src.split('\n').forEach((line, i) => {
        if (/\bconsole\.(log|info|debug|warn|error)\(/.test(line) && !/eslint-disable/.test(line)) {
          found.push({ file, line: i + 1, rule: 'no-console-log', detail: line.trim() });
        }
      });
      return found;
    },
  },
];

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE.test(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry)) out.push(full);
  }
}

const files: string[] = [];
for (const d of SCAN_DIRS) {
  try { walk(join(ROOT, d), files); } catch { /* dir may not exist yet */ }
}

const findings: Finding[] = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f);
  for (const r of rules) findings.push(...r.test(src, rel));
}

if (findings.length === 0) {
  console.log(`audit ok — ${files.length} files, ${rules.length} rules.`);
  process.exit(0);
}

console.log(`audit found ${findings.length} issue(s):`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}  [${f.rule}]  ${f.detail}`);
}
process.exit(1);
