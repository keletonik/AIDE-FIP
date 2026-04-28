# Deploying AIDE-FIP on Replit

This file is the source of truth for how AIDE-FIP runs on Replit. The
short version: **import the repo, set five Secrets, deploy as a Reserved
VM**. Reasoning and ops runbook below.

## TL;DR

```
[ ] Import keletonik/aide-fip from GitHub into Replit
[ ] Set Replit Secrets (see below) — including AIDE_BOOTSTRAP_*
[ ] Click Deploy → Reserved VM
[ ] Sign in at the deployment URL with your bootstrap username + password
```

That's it. The seeder runs at build time, sees the bootstrap secrets,
and creates the admin user automatically.

## Why Reserved VM, not Autoscale

AIDE-FIP keeps everything on local disk:

- SQLite at `./data/aide.db` (users, sites, defects, services, audit log,
  debug log)
- Photo uploads under `./data/uploads/defects/<id>/`

Replit's deployment targets:

| Target | Disk | Verdict |
|---|---|---|
| **Reserved VM** | Persistent across redeploys | **Use this** |
| **Autoscale (Cloud Run)** | Ephemeral — wipes on redeploy / scale event | Will lose your data |
| Static | N/A — we have a Node server | N/A |

`.replit` already targets `reservedvm`. Don't change it unless you've first
migrated `lib/db.ts` to Postgres and `lib/uploads.ts` to object storage.
There are TODOs for both when the time comes.

## Replit Secrets

Open the Repl → **Tools** → **Secrets**. Set these:

| Key | Required | Value | Why |
|---|---|---|---|
| `ADMIN_KEY` | yes (prod) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Break-glass for `/admin/*` if a session is busted |
| `AIDE_BOOTSTRAP_USERNAME` | yes (first deploy) | `Casper` | Admin username; login form accepts username or email |
| `AIDE_BOOTSTRAP_PASSWORD` | yes (first deploy) | `Ramekin881!` | Admin password; ≥ 8 chars |
| `AIDE_BOOTSTRAP_NAME` | optional | `Casper` | Display name on the audit log |
| `AIDE_BOOTSTRAP_EMAIL` | optional | `casper@your-domain` | Defaults to `<username>@aide-fip.local` |
| `NEXT_PUBLIC_KB_URL` | optional | `https://keletonik.github.io/knowledge-bage` | Override only if KB moves |
| `AIDE_DB_PATH` | optional | `./data/aide.db` | Only set if you want a non-default path |

Bootstrap is **one-time-effective** — re-running the seed never
overwrites an existing user. Rotate the admin password later with
`npm run user:create Casper '<new-password>' --admin --name 'Casper'`.

## What ships, what's recreated

| Asset | Created by | Survives redeploy? |
|---|---|---|
| Reference data (panels, standards, symptoms, categories, service templates) | `npm run db:seed` (build step) | Yes — re-seeded every build, by design |
| Schema (24 tables, v3) | Migrations in `lib/db.ts` | Yes — forward-only, idempotent |
| Bootstrap admin | Seeder + `AIDE_BOOTSTRAP_*` Secrets | Yes — created once, no-op thereafter |
| Sites, panels-on-site, detectors | Users via the UI | Yes (Reserved VM) — they live in `data/aide.db` on the persistent disk |
| Defects + photos | Users via the UI | Yes (Reserved VM) — DB rows + files under `data/uploads/` |
| Service records, brigade tests, C&E matrices, projects | Users via the UI | Yes |
| Sessions | Login | Yes — but they expire after 30 days |
| Audit log + debug log | Captured automatically | Yes |

## First-time deploy walkthrough

1. **Import repo.** Replit dashboard → Create Repl → Import from GitHub →
   `https://github.com/keletonik/aide-fip` → branch `main` (merge PR #1
   first if you haven't).
2. **Set Secrets.** All seven listed above, at minimum the four marked
   required.
3. **Verify in dev first.** Hit the green Run button. The webview should
   load the splash, then the home page. Sign in to confirm bootstrap
   worked.
4. **Deploy.** Top-right → Deploy → **Reserved VM**. Build = `npm run build`,
   Run = `npm run start` (already configured in `.replit`). Pick the
   smallest VM tier; this app is light.
5. **Smoke test the deployment URL.** See the smoke commands below.
6. **Confirm healthcheck.** `GET https://your-deploy.replit.app/api/healthz`
   returns `{"ok":true,"app":"aide-fip","schema":3,...}`.

## Day-to-day ops

### Pull latest from GitHub into the Repl

```bash
git pull origin main
npm install        # only if package.json changed
npm run db:seed    # only if data/*.json or schema migrations changed
```

The seeder is idempotent. Workflow data is never deleted by re-seeding.

### Rotate the admin password

```bash
npm run user:create Casper '<new-password>' --admin --name 'Casper'
```

### Add another tech (admin only)

Sign in as the admin → `/register` → fill in name, username, email,
password and role.

### Backup the DB + photos

```bash
npm run db:backup
# writes data/backups/<iso-timestamp>.tar.gz
```

Online backup — the app keeps serving while it runs (uses better-sqlite3's
`.backup()` API for the DB; tar for the uploads). Cron it on the Replit
shell, or run before/after a known-risky operation.

### Restore from a backup

```bash
# stop the running app first (so the SQLite file isn't being written to)
npm run db:restore data/backups/2026-04-28T05-12-33-000Z.tar.gz
# restart the app
```

A safety copy of the current DB is taken into `data/backups/.safety/`
before the restore overwrites anything.

### Inspect the DB by hand

```bash
sqlite3 data/aide.db
sqlite> SELECT id, username, role FROM users;
sqlite> SELECT * FROM audit_log ORDER BY id DESC LIMIT 20;
```

`sqlite` CLI is in `replit.nix` so it's available in the shell.

### Reset everything (dev only — destroys all user data)

```bash
npm run db:reset
```

## Healthcheck endpoint

```
GET /api/healthz
200 → { ok: true, app: "aide-fip", schema: 3, uptime_s, latency_ms, ts }
503 → { ok: false, ... } if SQLite is unreachable
```

Anonymous, fast, no rate limit. Wire Replit Deployments' healthcheck and
any external uptime monitor (BetterUptime, UptimeRobot) at this URL.

## Smoke commands you can run after deploy

```bash
DEPLOY=https://your-deploy.replit.app

# 1. Healthz
curl -s $DEPLOY/api/healthz | python3 -m json.tool

# 2. Manifest (PWA install)
curl -s -o /dev/null -w "manifest %{http_code}\n" $DEPLOY/manifest.webmanifest

# 3. Login
curl -s -c /tmp/c.txt -X POST $DEPLOY/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"identifier":"Casper","password":"<your-password>"}'

# 4. Authenticated GET
curl -s -b /tmp/c.txt -o /dev/null -w "/sites %{http_code}\n" $DEPLOY/sites
```

All four should return 200 (and `manifest` should hand back JSON).

## Native binary gotchas

`better-sqlite3` is a native addon. It builds at `npm install` time
against the system's exact Node version. `replit.nix` ships nodejs_20,
gcc, gnumake, python3 and pkg-config, which is everything node-gyp needs.

If install ever fails with a node-gyp error after a Replit Nix channel
bump:

```bash
rm -rf node_modules package-lock.json
npm install
```

The lockfile is regenerated against the current Node and the addon
rebuilds clean.

## Costs

Reserved VM on Replit is around USD $10–15/mo at the smallest tier as
of writing. That's the only ongoing infra cost — no Postgres add-on, no
S3, no CDN.

If you want to drop to free, use the Repl's dev workspace as your
"production" with the **Always-On** boost (cheaper than a VM but the URL
is the workspace URL). Same persistent-disk story applies.

## When to outgrow this setup

Move to Postgres + object storage when **any of**:

- You need more than one tech writing concurrently (SQLite is single-writer)
- You exceed ~10 GB of photos
- You need read replicas or geo-distribution
- You're on call and can't restore a backup at 3 am

Replit has a built-in Postgres add-on; Neon and Supabase work too. The
swap is one file (`lib/db.ts` → `pg` or `postgres.js`), one migration
runner change, and a job to copy `aide.db` rows into the new schema.
Photos move to Replit Object Storage or any S3-compatible bucket via a
new `lib/uploads.ts` adapter. Half a day's work when you need it.
