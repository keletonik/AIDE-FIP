# AIDE-FIP

Field reference, battery calculator and troubleshooting wizard for Australian
fire indicator panel work. Built to be useful in a riser cupboard at 2am with
one bar of 4G — fast, big tap targets, offline once cached.

## What's in here

- **Standards** — paraphrased clauses for AS 1670.x / AS 1851 / AS 3745. Links
  out to the knowledge-bage knowledge base for the verbatim text.
- **Panels** — Pertronic F100/F120, Ampac FireFinder PLUS, Notifier ID3000,
  Simplex 4100ES, Vigilant MX1, Bosch FPA-1200, Hochiki FireNET, Tyco BC200.
  Day-mode and engineer keystrokes plus seed battery loads.
- **Battery calc** — standby + alarm sizing with ageing factor and a suggested
  commercial battery size.
- **Troubleshoot** — symptom → ranked causes → remediation.
- **Products** — normalised category vocabulary used by the product selector.
  Wires up to Flaro in V2.
- **Admin** — `/admin/audit`, `/admin/debug`, `/admin/health` (gated by
  `ADMIN_KEY`).

## Stack

| | |
|---|---|
| Runtime | Next.js 15 (App Router), React 19, TypeScript |
| Storage | SQLite via `better-sqlite3` (file under `./data/aide.db`) |
| Styling | Tailwind |
| Validation | Zod |
| Offline | Manifest + service worker, cached app shell |
| Hosting | Replit (Cloud Run target on `npm start`) |

SQLite was chosen over Supabase for the first cut so a Replit deployment is
zero-config: the file lives next to the app, the seed runs at build time, and
WAL mode keeps reads non-blocking.

## Running locally

```bash
npm install
npm run db:seed     # one-off — populates data/aide.db from data/*.json
npm run dev         # http://localhost:3000
```

## Deploy to Replit

1. Import the repo into Replit (or fork into the Replit GitHub integration).
2. Replit picks up `replit.nix` for system deps and `.replit` for the run
   command. Production starts via `npm run build && npm start`.
3. Add an `ADMIN_KEY` secret in the Replit Secrets panel — anything random
   and >32 chars. Without it the admin pages are open in dev only.
4. Optional: set `NEXT_PUBLIC_KB_URL` if knowledge-bage moves off
   `keletonik.github.io/knowledge-bage`.

## In-app debugger and auditor

The `track()` and `audit()` helpers in `lib/debugger.ts` and `lib/audit.ts`
record every meaningful operation into the same SQLite file the app uses for
content. The dashboards under `/admin` read from those tables — there is no
external telemetry pipeline. Trade-off: you own your data, you also own your
trim and rotation policy. The debugger soft-caps to 5000 rows.

There's also a static auditor that scans the codebase for project-specific
invariants (no third-party telemetry, KB URLs only via `lib/kb.ts`, no stray
`console.log`):

```bash
npm run audit:check
```

## Knowledge-bage contract

Outbound URLs follow the slug pattern documented in `BUILD.md`:

```
{KB_URL}/standards/{id}
{KB_URL}/standards/{id}/clause-{number}
{KB_URL}/panels/{slug}
{KB_URL}/troubleshooting/{slug}
```

All built via `lib/kb.ts`. Don't construct knowledge-base URLs anywhere else;
the auditor will fail your build.
