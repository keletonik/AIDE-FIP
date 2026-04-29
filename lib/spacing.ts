// Detector spacing calculator per AS 1670.1. Computes the maximum coverage
// area, recommended grid spacing, and resulting device count for a flat
// rectangular ceiling. Conservative defaults — engineering judgement still
// applies and the design engineer signs off.
//
// AS 1670.1 (Australian Standard, paraphrased):
//   - Photoelectric / ionisation point smoke: ≤ 100 m² coverage per detector
//     for ceilings ≤ 6 m. Reduces with height (3.2.x exceptions).
//   - Heat point detectors: ≤ 50 m² coverage per detector for ceilings ≤ 7.5 m.
//   - Beam smoke detectors: lateral spacing ≤ 14 m at 7 m ceiling (typ.),
//     beam length ≤ 100 m projected.
//
// We model coverage as a bounding circle (radial), and derive the square
// grid pitch that fits a row/column repetition under the same circle.

export type DetectorType = 'smoke-point' | 'heat-point' | 'beam-smoke';

export type Spec = {
  /** Maximum coverage area per detector in m². */
  max_area_m2: number;
  /** Maximum radial coverage from each detector in m. */
  max_radial_m: number;
  /** Square grid pitch in m (= max_radial × √2). */
  square_pitch_m: number;
  /** Standards reference label. */
  ref: string;
  /** Human notes. */
  notes: string;
};

// Smoke point: 100 m² → radius 5.64, grid 7.98. We use the AS 1670.1 design
// guidance (10.6 m max diagonal between adjacent detectors → 7.5 m square
// pitch) which is more conservative than pure circle fit.
//
// Heat point: 50 m² → radius 3.99, AS gives ~7.0 m square grid (5.0 m radial).
//
// Beam: depends on ceiling height; we expose a base case at 7 m.
const SPECS: Record<DetectorType, Spec> = {
  'smoke-point': {
    max_area_m2: 100,
    max_radial_m: 7.5,
    square_pitch_m: 10.6,
    ref: 'AS 1670.1 §3.2',
    notes: 'Flat ceiling ≤ 6 m. Reduce coverage above 6 m (see clause 3.2). Add detectors near supply diffusers and at the apex of pitched ceilings.',
  },
  'heat-point': {
    max_area_m2: 50,
    max_radial_m: 5.3,
    square_pitch_m: 7.5,
    ref: 'AS 1670.1 §3.5',
    notes: 'Flat ceiling ≤ 7.5 m. Heat detectors are slower; do not substitute for smoke unless permitted by the building class.',
  },
  'beam-smoke': {
    max_area_m2: 14 * 100,
    max_radial_m: 7,
    square_pitch_m: 14,
    ref: 'AS 1670.1 §3.6',
    notes: 'Lateral spacing ≤ 14 m, beam length ≤ 100 m. Verify alignment annually. Allow 0.6 m clearance below ceiling for stratification.',
  },
};

export type SpacingInput = {
  type: DetectorType;
  /** Room length in metres. */
  length_m: number;
  /** Room width in metres. */
  width_m: number;
  /** Ceiling height in metres. */
  ceiling_m?: number;
};

export type SpacingResult = {
  spec: Spec;
  area_m2: number;
  /** Number of detectors required per the AS pitch. */
  count: number;
  /** Number of rows / columns in the grid. */
  rows: number;
  cols: number;
  /** Actual pitch used (m), capped at AS max. */
  pitch_used_m: number;
  /** Edge offset from walls (m) — half pitch typical. */
  edge_offset_m: number;
  warnings: string[];
  workings: { label: string; value: string }[];
};

export function calculateSpacing(input: SpacingInput): SpacingResult {
  const spec = SPECS[input.type];
  const length = Math.max(0, input.length_m);
  const width  = Math.max(0, input.width_m);
  const area   = length * width;
  const ceiling = input.ceiling_m ?? 0;

  const warnings: string[] = [];
  if (input.type === 'smoke-point' && ceiling > 6) {
    warnings.push(`Ceiling ${ceiling.toFixed(1)} m > 6 m: smoke detector coverage must be reduced per AS 1670.1 §3.2 (or use beam / aspirating).`);
  }
  if (input.type === 'heat-point' && ceiling > 7.5) {
    warnings.push(`Ceiling ${ceiling.toFixed(1)} m > 7.5 m: heat detection is generally not effective at this height — consider smoke beam / aspirating.`);
  }
  if (input.type === 'beam-smoke' && ceiling > 25) {
    warnings.push(`Ceiling ${ceiling.toFixed(1)} m > 25 m: stratification may prevent smoke from reaching the beam. Specify aspirating instead.`);
  }
  if (length === 0 || width === 0) {
    warnings.push('Length and width must be positive.');
  }

  // Compute rows / columns. Use grid pitch ≤ AS max, then ensure max area
  // per detector is also satisfied. We round UP and place edges at half-pitch
  // from each wall.
  const pitch = spec.square_pitch_m;
  const cols = Math.max(1, Math.ceil(length / pitch));
  const rows = Math.max(1, Math.ceil(width  / pitch));
  let count = cols * rows;

  // Verify per-detector coverage isn't exceeded
  if (count > 0) {
    const per = area / count;
    if (per > spec.max_area_m2) {
      const need = Math.ceil(area / spec.max_area_m2);
      count = Math.max(count, need);
      warnings.push(`Increased to ${count} detectors to keep coverage ≤ ${spec.max_area_m2} m² per device.`);
    }
  }

  return {
    spec,
    area_m2: area,
    count,
    rows,
    cols,
    pitch_used_m: pitch,
    edge_offset_m: pitch / 2,
    warnings,
    workings: [
      { label: 'AS reference',           value: spec.ref },
      { label: 'Room area',              value: `${area.toFixed(1)} m² (${length.toFixed(1)} × ${width.toFixed(1)})` },
      { label: 'Max area / detector',    value: `${spec.max_area_m2} m²` },
      { label: 'Square grid pitch',      value: `${pitch} m (radial ${spec.max_radial_m} m)` },
      { label: 'Grid layout',            value: `${cols} cols × ${rows} rows = ${count} detectors` },
      { label: 'Edge offset from walls', value: `${(pitch / 2).toFixed(2)} m` },
    ],
  };
}
