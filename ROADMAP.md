# AIDE-FIP roadmap

Outcome of the fire-panel domain-expert audit. Top-15 prioritised by
**frequency × hours saved**, ordered by value.

## v1 (shipped before this PR)

- 9 panels (Pertronic F100/F120, Ampac FireFinder PLUS, Notifier ID3000,
  Simplex 4100ES, Vigilant MX1, Bosch FPA-1200, Hochiki FireNET, Tyco BC200)
- 7 standards (AS 1670.1, 1670.4, 1851, 2118.1, 2419.1, 2444, 3745)
- 5 troubleshooting symptoms / 16 causes
- Battery calc, troubleshoot, sites, defects, projects, brigade tests, CE matrix

## v2 (this PR)

- **+14 panels.** Now 23: adds Pertronic F16e, Notifier NFS2-3030, EST3,
  Vigilant FP1100 + T-Gen 50, Bosch FPA-1200 (existing), Mircom FX-2000,
  Ziton ZP3, GST GST-200N, Morley DXc, Inim Previdia Compact, Tyco F3200/F4000
  legacy, Tyco MX 4428, Ampac FireFinder SP1 legacy.
- **+20 troubleshooting symptoms.** Now 25 covering loop short, charger fault,
  battery test fail, intermittent zone alarm, sounder no-activate / hum,
  ASE fault / no-test-signal, mains failure, detector contamination /
  maintenance overdue, MCP false alarm, isolator chatter, lift recall fail,
  smoke curtain no-deploy, network comms fail, WIP / speaker line, VESDA
  airflow, overnight false alarm, keypad lockout, sprinkler flow, duct detector,
  event log full.
- **+6 standards.** Adds AS 4428.16 EWIS control equipment, AS 7240.21 routing
  equipment (ASE), AS 7240.23 visual alarm devices, AS 1735.11 fire-rated lift,
  AS 1668.1 fire-mode HVAC, AS/NZS 3013 cable WS classification.
- **Loop voltage-drop calculator** (`/loop-calc`). Per-protocol budgets
  (Apollo Discovery/Soteria, Hochiki ESP, Notifier CLIP/OPAL, Simplex IDNet,
  Bosch LSN, Pertronic, GST). Real cable physics: V_drop = I × R × 2,
  Class A/B handling.
- **Detector spacing calculator** (`/spacing`). AS 1670.1 §3.2/§3.5/§3.6 grid
  sizing for point smoke, point heat and beam smoke detectors on flat
  rectangular ceilings.
- **Cable selector** (`/cables`). FP200 (WS52W), MIMS / MICC, FR-SWA, FP200
  Flex, plus identification of non-fire-rated cable found on retrofits.
- **Per-panel programming reference** (`/panels/[slug]/programming`). 12
  common tasks (engineer mode, walk-test, address, isolate, force output,
  cause-and-effect, firmware version, event log, soft reset, day/night,
  network ID, ASE config). KB-link-out — does not paraphrase keystrokes.
- iOS / Android via Capacitor (from previous commit).
- 18 audit criticals fixed.

## v3 (this PR)

Top-of-ranking items from v2 roadmap, shipped:

- **`/triage` — after-hours triage mode.** Same troubleshooting data, dark
  big-button single-thumb UI for on-call work. Symptom → top causes →
  remediation, no brigade-dial.
- **Active isolation register.** New DB table (V4 migration), CRUD per site
  (`/sites/[id]/isolations`), cross-site dashboard (`/isolations`) with
  overdue-since-N-hours flags (24 h amber, 72 h red). Site detail page
  surfaces active count as a Stat tile. Closes the most-overlooked
  liability gap in service work.
- **`/coverage` — sounder dB + strobe candela coverage.** Free-field SPL
  drop (inverse-square ÷ d²), energy-sum with ambient noise, target
  headroom. Strobe AS 7240.23 / NFPA 72 ceiling Class C square-room
  candela table.
- **`/zone-check` — AS 1670.1 §4.3 zone-area sanity check.** Floor-by-
  floor zone count plus mandatory split count (stairs / lifts / risers /
  plant / roof void). Sleeping-risk class flag caps zone area at 1000 m².
- **`/eol` — EOL resistor reference per panel.** Value, polarity, watts,
  spur-handling notes for every panel in the registry. Multimeter
  reading guidance (±5% at 20 °C floor).
- **`/ce-templates` — cause-and-effect template library.** 6 building
  classes (Class 5 office, 9a hospital, 7a car park, 2 residential, 9b
  school, 8 warehouse). Zones × outputs × rules. Reference / starting
  point — does NOT auto-program panels (anti-feature #7).
- **`/tools` — field tools index.** Hub for battery, loop, spacing,
  coverage, zone-check, cables, EOL.

## v4 — next high-value features (ranked)

| # | Item | Frequency | Saved | Effort | Notes |
|---|---|---|---|---|---|
| 1 | **Walk-test logger with QR scan** | Weekly+ | 1.5–3 h | M | Capacitor barcode scan; tag each device tested with time/initials/photo; AS 1851 §6.4 sample-percentage tracker (10/25/100% rolling 12 months). Needs new `walk_tests` + `walk_test_devices` tables. |
| 2 | **Defect-with-photo email/PDF to building owner** | Weekly | 0.5 h | M | One-click: defect, photo, severity, AS clause, due-by date. Needs PDF lib + email transport (SMTP / SES). |
| 3 | **Monthly + 6-monthly + annual service report PDF (signed)** | Monthly per site | 1–2 h | M | Branded, AS 1851 evidence. Signature-on-glass via Capacitor canvas plugin. |
| 4 | **Battery sizing extension — multi-PSU / EWIS / ASE / sub-panel** | Weekly | 0.5–1.5 h | M | Existing battery_projects already supports multi-FIP; extend with EWIS amp + ASE + sub-panel as separate rows. |
| 5 | **Brigade test logger w/ MC contact book + witness signature** | 6-monthly | 0.5 h | S | Existing brigade_tests table; add monitoring_centre contact directory + signature capture. |
| 6 | **Asset register with QR codes per device** | Compounds | 0.25 h/lookup | L | Capacitor barcode scanner + new `assets` table. QR encodes device URL → opens record. |
| 7 | **AS 1851 sample-percentage tracker** | Weekly | 0.25 h | S | Rolling-12-month sample target across detectors using existing detectors table + last_tested_at. |
| 8 | **Aspirating (VESDA) pipe-network sanity** | Monthly | 1 h | L | Transport time estimate, hole count, sensitivity class A/B/C. AS 1670.1 §3.10. |
| 9 | **Travel + timesheet capture** | Daily | 0.25 h | M | Start/stop on a job, optional GPS geofence. |
| 10 | **Customer-facing dashboard** | Per-customer | 0.5–1 h | L | Building manager view: AFSS due, open defects with photos, last service date, contact tech. |
| 11 | **Photo annotation** | Weekly | 0.25 h | M | Draw circle/arrow/callout on defect photos. Capacitor canvas. |
| 12 | **EWIS layout helper** | Project | 1–2 h | M | AS 4428.16 / AS 1670.4 speaker spacing + watts/floor + STI estimate (estimate only — STI compliance still requires calibrated meter). |
| 13 | **Voice notes per site** | Weekly | 0.25 h | S | Capacitor Voice Recorder plugin; attached to site or defect. |
| 14 | **Stock / van inventory** | Daily | 0.1 h | M | "Used 2× SOH-220 today" → restock list. |
| 15 | **Notification system** | Weekly | n/a | M | Capacitor Local Notifications for overdue services, expiring detectors, brigade test deadlines. |

## v4 — bigger lifts

- **True offline-first.** Capacitor SQLite on device + sync to Replit
  server. Allows sites with no signal (riser cupboards) to record defects
  and photos and reconcile when reconnected. Multi-week project.
- **EWIS layout helper.** AS 4428.16 / AS 1670.4 speaker spacing, watts/floor,
  STI estimate. Estimate only — STI compliance still requires a calibrated
  meter.
- **Customer-facing dashboard.** Building-manager view: AFSS due, open
  defects with photos, last service date, contact tech.
- **Voice notes per site.** Capacitor Voice Recorder plugin.
- **Photo annotation.** Draw circle/arrow on a defect photo. Capacitor
  + canvas.
- **Stock / van inventory.** "Used 2× SOH-220" → restock list.
- **Multi-tech site collab.** Two techs working a job simultaneously.
- **Compliance-form pre-fill.** NSW AFSS, ACT FSC pre-fill from defect
  register evidence.

## Things that won't ship

See `DESIGN_PRINCIPLES.md` for the explicit anti-feature list.
