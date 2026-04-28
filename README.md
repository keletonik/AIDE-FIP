# AIDE-FIP

Field reference, jobsheet system, battery calculator, AS 1851 service workflow,
cause-and-effect editor and brigade test logger for Australian fire indicator
panel work. PWA-installable for plant rooms with no signal.

## Modules

**Reference (open without login)**
- **Standards** — paraphrased clauses for AS 1670.x / AS 1851 / AS 3745 with
  deep-links into the knowledge-bage knowledge base.
- **Panels catalogue** — Pertronic F100/F120, Ampac FireFinder PLUS, Notifier
  ID3000, Simplex 4100ES, Vigilant MX1, Bosch FPA-1200, Hochiki FireNET,
  Tyco BC200. Day-mode + engineer keystrokes plus seed battery loads.
- **Battery calc** — single panel, standby + alarm sizing with ageing factor.
- **Troubleshoot** — symptom → ranked causes → remediation.
- **Products** — normalised category vocabulary (V2 Flaro hook).

**Workflow (sign-in required)**
- **Sites** — name, address, contact, notes. Per-site dashboard.
- **Site panels** — link panels-on-catalogue to sites with label, location,
  install date.
- **Detector register** — per-panel addressable register with install date,
  last-tested-at and ageing report (overdue / due-soon / ok).
- **Defects** — severity, description, location, photo upload (multipart),
  status (open → in_progress → resolved + resolution notes).
- **AS 1851 service records** — checklist templates (monthly, six-monthly,
  annual, panel handover) with per-item pass/fail + notes.
- **Brigade tests** — line, monitoring centre, signal received, response
  time, witnesses.
- **Cause-and-effect matrix** — zones × outputs grid editor with state codes
  (X / D / M / blank).
- **Battery projects** — multi-panel buildings, roll-up of standby + alarm
  load across all FIPs in scope.
- **Site pack** — print-ready single-page summary (browser save-as-PDF).

**Admin**
- `/admin/audit` — actor-tagged audit log of every meaningful action.
- `/admin/debug` — in-process observability. Levels, durations, last 5000.
- `/admin/health` — runtime stats and row counts.
- `/admin/users` — user list (admin only).

## Roles

| Role   | Read | Write workflow | Manage users | Delete |
|--------|------|----------------|--------------|--------|
| viewer | yes  | no             | no           | no     |
| tech   | yes  | yes            | no           | no     |
| admin  | yes  | yes            | yes          | yes    |

## Stack

| | |
|---|---|
| Runtime | Next.js 15 (App Router), React 19, TypeScript |
| Storage | SQLite via `better-sqlite3` (`./data/aide.db`) |
| Uploads | Filesystem under `./data/uploads/<bucket>/<key>/` |
| Auth    | scrypt password hashing, opaque session cookie, 30-day expiry |
| Styling | Tailwind |
| Validation | Zod |
| Offline | Manifest + service worker, cached app shell |
| Hosting | Replit (Cloud Run target on `npm start`) |

SQLite + filesystem uploads were chosen over Postgres + S3 so a Replit
deployment is zero-config: everything an admin needs to back up lives under
the `data/` folder. WAL mode keeps reads non-blocking during writes.

## Running locally

```bash
npm install
npm run db:seed   # populates data/aide.db from data/*.json
npm run dev       # http://localhost:3000
```

The first user you register at `/register` becomes the admin. After that,
public registration is closed and only an admin can add users.

## Deploy to Replit

1. Import the repo into Replit.
2. Replit picks up `replit.nix` + `.replit`. Production starts via
   `npm run build && npm start`.
3. Add a secret `ADMIN_KEY` (long random string) in Replit Secrets — required
   for `/admin/*` in production. Without it, admin pages are open in dev only.
4. Optional secret `NEXT_PUBLIC_KB_URL` to point at a different knowledge-bage.

The Replit filesystem is persistent, so `data/aide.db` and uploaded photos
survive container restarts. Take periodic snapshots of the `data/` folder.

## In-app debugger and auditor

- `lib/audit.ts::audit()` records every user-meaningful action with the
  actor's email, IP, user-agent and a JSON payload.
- `lib/debugger.ts::track()` wraps server work and writes level / source /
  duration / meta into `debug_log`. Soft-cap 5000 rows.
- The `/admin/debug` and `/admin/audit` pages read from the same SQLite file
  the app writes — no external telemetry pipeline.

A static auditor scans the codebase for project-specific invariants:

```bash
npm run audit:check
```

Rules: no third-party telemetry SDKs, no admin key on the client, no bare
`console.log`, KB URLs only via `lib/kb.ts`.

## Knowledge-bage contract

Outbound URLs follow the slug pattern from BUILD.md:

```
{KB_URL}/standards/{id}
{KB_URL}/standards/{id}/clause-{number}
{KB_URL}/panels/{slug}
{KB_URL}/troubleshooting/{slug}
```

All built via `lib/kb.ts`. Don't construct knowledge-base URLs anywhere else
— the auditor will fail your build.
