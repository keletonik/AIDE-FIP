// Sounder dB attenuation and visual-alarm-device (strobe) candela coverage.
// Both are pure physics / geometry — no panel-specific magic. Engineering
// judgement still applies; STI compliance per AS 1670.4 requires a
// calibrated sound level meter and a competent person.

// ---------- Sounder dB at distance --------------------------------------
//
// Inverse-square in free field: SPL drops 6 dB per doubling of distance
// from a point source. In a real building (reverberant, partition losses)
// drop is somewhat less, but free-field is the conservative estimate
// — it predicts a worse SPL than reality, so a free-field "pass" is
// usually a real pass.

export type SounderInput = {
  /** Source SPL at 1 m, dB(A). */
  source_db_at_1m: number;
  /** Distance from source to listener, m. */
  distance_m: number;
  /** Ambient (background) noise level at the listener, dB(A). */
  ambient_db: number;
  /** Target SPL above ambient required by the standard, dB(A).
   *  AS 1670.1 §3.22 typical: 65 dB(A) total, or 75 dB(A) at bedhead, or 15 dB above ambient — whichever is higher. */
  target_db: number;
};

export type SounderResult = {
  /** SPL of the sounder alone at the listener, dB(A) (free-field model). */
  spl_at_listener: number;
  /** Combined SPL of sounder + ambient at the listener, dB(A) (energy sum). */
  spl_combined: number;
  /** Headroom above the required target, dB. Negative = fail. */
  headroom_db: number;
  status: 'pass' | 'warn' | 'fail';
  workings: { label: string; value: string }[];
};

export function calculateSounder(input: SounderInput): SounderResult {
  const d = Math.max(0.1, input.distance_m);
  // dB drop = 20 * log10(d / d_ref). d_ref = 1 m.
  const drop = 20 * Math.log10(d / 1);
  const spl_alone = input.source_db_at_1m - drop;

  // Combine sounder + ambient (energy sum): 10*log10(10^(a/10) + 10^(b/10))
  const spl_combined = 10 * Math.log10(
    Math.pow(10, spl_alone / 10) + Math.pow(10, input.ambient_db / 10),
  );

  const headroom_db = spl_combined - input.target_db;
  let status: SounderResult['status'];
  if (headroom_db < 0) status = 'fail';
  else if (headroom_db < 3) status = 'warn';
  else status = 'pass';

  return {
    spl_at_listener: spl_alone,
    spl_combined,
    headroom_db,
    status,
    workings: [
      { label: 'Distance attenuation',  value: `−${drop.toFixed(1)} dB at ${d.toFixed(1)} m (free-field, ÷ d² law)` },
      { label: 'SPL of sounder alone',  value: `${spl_alone.toFixed(1)} dB(A)` },
      { label: 'SPL with ambient',      value: `${spl_combined.toFixed(1)} dB(A) (energy sum with ${input.ambient_db.toFixed(0)} dB ambient)` },
      { label: 'Required',              value: `${input.target_db.toFixed(0)} dB(A)` },
      { label: 'Headroom',              value: `${headroom_db >= 0 ? '+' : ''}${headroom_db.toFixed(1)} dB` },
    ],
  };
}

// ---------- Strobe candela coverage (AS 7240.23 / NFPA 72 model) ---------
//
// Ceiling-mount Class C ratings have published cd-vs-room-size tables; we
// use a conservative interpolation. Rated cd values are at the extreme
// corner of a square room with ceiling height up to 3 m. Higher ceilings
// or wall-mount Class W use different tables.

export type StrobeMount = 'ceiling-c' | 'wall-w';

export type StrobeInput = {
  mount: StrobeMount;
  /** Square room — longest side in m. Rectangular rooms use the long side. */
  room_side_m: number;
  /** Ceiling height in m. */
  ceiling_m: number;
};

export type StrobeResult = {
  /** Required candela rating from AS 7240.23 / NFPA 72-style table. */
  required_cd: number;
  /** Recommended commercial cd rating (next standard size up). */
  fit_cd: number;
  notes: string;
  warnings: string[];
};

// Square room cd table — corner-of-square coverage, ceiling up to 3 m.
// Conservative; for larger rooms, multiple devices required.
const TABLE_SQUARE_C: { side: number; cd: number }[] = [
  { side:  6.1, cd:   15 },
  { side:  9.1, cd:   30 },
  { side: 12.2, cd:   60 },
  { side: 15.2, cd:   95 },
  { side: 18.0, cd: 135 },
  { side: 21.0, cd: 185 },
  { side: 24.0, cd: 240 },
];
const COMMERCIAL_CD = [15, 30, 60, 75, 95, 110, 135, 150, 185, 240, 320];

export function calculateStrobe(input: StrobeInput): StrobeResult {
  const warnings: string[] = [];
  const side = Math.max(0.1, input.room_side_m);

  if (input.mount === 'wall-w' && input.ceiling_m > 0) {
    warnings.push('Wall-mount Class W tables are not modelled here — Class W permits lower cd at the cost of vertical coverage. Use the AS 7240.23 table directly for wall-mount.');
  }
  if (input.ceiling_m > 3) {
    warnings.push(`Ceiling ${input.ceiling_m.toFixed(1)} m > 3 m: required cd increases per the high-ceiling table; this calculator assumes the 3 m baseline.`);
  }

  // Linear interpolate between table rows; if larger than the largest,
  // recommend multiple devices.
  let required_cd: number;
  if (side <= TABLE_SQUARE_C[0].side) {
    required_cd = TABLE_SQUARE_C[0].cd;
  } else if (side >= TABLE_SQUARE_C[TABLE_SQUARE_C.length - 1].side) {
    required_cd = TABLE_SQUARE_C[TABLE_SQUARE_C.length - 1].cd;
    warnings.push(`Room ${side.toFixed(1)} m exceeds single-device coverage — split into multiple zones, each ≤ ${TABLE_SQUARE_C[TABLE_SQUARE_C.length - 1].side} m.`);
  } else {
    let lo = TABLE_SQUARE_C[0];
    let hi = TABLE_SQUARE_C[1];
    for (let i = 1; i < TABLE_SQUARE_C.length; i++) {
      if (TABLE_SQUARE_C[i].side >= side) { hi = TABLE_SQUARE_C[i]; lo = TABLE_SQUARE_C[i - 1]; break; }
    }
    const t = (side - lo.side) / (hi.side - lo.side);
    required_cd = Math.ceil(lo.cd + (hi.cd - lo.cd) * t);
  }

  const fit_cd = COMMERCIAL_CD.find((c) => c >= required_cd) ?? required_cd;

  return {
    required_cd,
    fit_cd,
    notes: 'AS 7240.23 / NFPA 72 model. Square ceiling-mount Class C, ceiling ≤ 3 m. For obstructed ceilings, larger rooms or wall-mount, refer directly to the standard.',
    warnings,
  };
}
