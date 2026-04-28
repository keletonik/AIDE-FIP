import { all } from './db';

// Battery sizing for an FIP per AS 1670.1 design intent: cover the
// nominated standby period followed by the alarm period from the same
// battery bank, then size the bank with a derating factor for end-of-life
// capacity. This is a calculation aid — the design engineer signs off.

export type BatteryInput = {
  panelSlug: string;
  /** Standby hours required (commonly 24). */
  standbyHours: number;
  /** Alarm minutes required (commonly 30). */
  alarmMinutes: number;
  /** Optional extra constant standby load in mA (e.g. mimic, ASE). */
  extraStandbyMa?: number;
  /** Optional extra constant alarm load in mA (e.g. external sounders). */
  extraAlarmMa?: number;
  /** Battery capacity safety / ageing factor (commonly 1.25). */
  ageingFactor?: number;
};

export type BatteryResult = {
  panelSlug: string;
  standbyMa: number;
  alarmMa: number;
  extraStandbyMa: number;
  extraAlarmMa: number;
  standbyHours: number;
  alarmMinutes: number;
  ageingFactor: number;
  /** Required battery capacity in amp-hours, rounded up to one decimal. */
  requiredAh: number;
  /** Suggested commercial battery size (next step up from required). */
  suggestedAh: number;
  workings: { label: string; value: string }[];
};

const COMMERCIAL_SIZES_AH = [7, 12, 17, 24, 38, 50, 65, 100, 120];

function nextCommercial(ah: number): number {
  for (const c of COMMERCIAL_SIZES_AH) if (c >= ah) return c;
  return Math.ceil(ah / 10) * 10;
}

export function calculateBattery(input: BatteryInput): BatteryResult {
  const standbyHours = clampPositive(input.standbyHours, 24);
  const alarmMinutes = clampPositive(input.alarmMinutes, 30);
  const extraStandbyMa = clampNonNegative(input.extraStandbyMa ?? 0);
  const extraAlarmMa   = clampNonNegative(input.extraAlarmMa ?? 0);
  const ageingFactor   = clampRange(input.ageingFactor ?? 1.25, 1.0, 2.0);

  const loads = all<{ mode: 'standby' | 'alarm'; current_ma: number }>(
    `SELECT mode, current_ma FROM battery_loads WHERE panel_slug = ?`,
    [input.panelSlug],
  );
  const standbyMa = (loads.find(l => l.mode === 'standby')?.current_ma ?? 0) + extraStandbyMa;
  const alarmMa   = (loads.find(l => l.mode === 'alarm')?.current_ma   ?? 0) + extraAlarmMa;

  const standbyAh = (standbyMa / 1000) * standbyHours;
  const alarmAh   = (alarmMa   / 1000) * (alarmMinutes / 60);
  const baseAh    = standbyAh + alarmAh;
  const requiredAh = +(baseAh * ageingFactor).toFixed(1);
  const suggestedAh = nextCommercial(requiredAh);

  return {
    panelSlug: input.panelSlug,
    standbyMa, alarmMa, extraStandbyMa, extraAlarmMa,
    standbyHours, alarmMinutes, ageingFactor,
    requiredAh, suggestedAh,
    workings: [
      { label: 'Standby load',       value: `${standbyMa.toFixed(0)} mA × ${standbyHours} h = ${standbyAh.toFixed(2)} Ah` },
      { label: 'Alarm load',         value: `${alarmMa.toFixed(0)} mA × ${alarmMinutes} min = ${alarmAh.toFixed(2)} Ah` },
      { label: 'Subtotal',           value: `${baseAh.toFixed(2)} Ah` },
      { label: `Ageing factor ×${ageingFactor}`, value: `${requiredAh.toFixed(1)} Ah required` },
      { label: 'Suggested fitting',  value: `${suggestedAh} Ah (next commercial size up)` },
    ],
  };
}

function clampPositive(n: number, fallback: number): number {
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function clampRange(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
