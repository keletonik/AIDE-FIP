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

## v3 — high-value features (next, ranked)

| # | Item | Frequency | Saved | Effort | Notes |
|---|---|---|---|---|---|
| 1 | **After-hours / call-out triage mode** | Daily on-call | 0.5–1.5 h | M | Big-button site → symptom → top causes → MC contact. Dark mode, large hit-targets. |
| 2 | **Walk-test logger with QR scan** | Weekly+ | 1.5–3 h | M | Tag each device tested, AS 1851 §6.4 sample-percentage tracker (10/25/100% rolling 12 months). |
| 3 | **Active isolation register with leave-site safeguard** | Daily | prevents one $50k incident/yr | S | Live disabled-list across all sites; pre-leaving alert. |
| 4 | **Battery sizing extension — multi-PSU / EWIS / ASE / sub-panel** | Weekly | 0.5–1.5 h | M | Currently single-FIP. Add EWIS amp + ASE + sub-panel rollup. |
| 5 | **Defect-with-photo email/PDF to building owner** | Weekly | 0.5 h | M | One-click: defect, photo, severity, AS clause, due-by date. |
| 6 | **Monthly + 6-monthly + annual service report PDF (signed)** | Monthly per site | 1–2 h | M | Branded, AS 1851 evidence. Signature on glass. |
| 7 | **Cause-and-effect template library by building class** | Monthly | 2–4 h | M | Class 5 office, Class 9a hospital, Class 7a car park, Class 2 residential, Class 8 mining/warehouse, Class 9b school. |
| 8 | **Brigade test logger with MC contact book + witness signature** | 6-monthly per site | 0.5 h | S | Pre-test checklist, witness sign on glass. |
| 9 | **Sounder/strobe coverage calculator** | Monthly | 0.5–1 h | S | dB at distance, AS 7240.23 cd / coverage volume class. |
| 10 | **Asset register with QR codes per device** | Compounds | 0.25 h/lookup | L | Capacitor barcode scanner + per-device record. |
| 11 | **EOL resistor calculator** | Weekly | 0.25 h | S | Per-panel EOL value, polarity, parallel/series for spur conversions. |
| 12 | **AS 1851 sample-percentage tracker** | Weekly | 0.25 h | S | Rolling-12-month sample target across detectors. |
| 13 | **Zone-area check** | Per-job | 0.25 h | S | Confirms ≤ 2000 m² and one-zone-per-floor at handover. |
| 14 | **Aspirating (VESDA) pipe-network sanity** | Monthly | 1 h | L | Transport time estimate, hole count, sensitivity class A/B/C. |
| 15 | **Travel + timesheet capture** | Daily | 0.25 h | M | Start/stop on a job, optional GPS geofence. |

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
