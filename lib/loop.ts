// Loop voltage-drop calculator. Computes the minimum loop voltage at the
// far end of a Class A or Class B fire alarm SLC given device current,
// cable resistance and supply voltage. Pure physics — no panel-specific
// magic. The ENGINEER signs off on the actual design; this is a fast
// sanity check before specifying a long run.
//
// Model:
//   V_drop = I * R * 2     (factor 2 because current goes out and back)
//   V_end  = V_supply - V_drop
//   I      = devices_current_total + safety_margin
//
// Class A (loop with redundancy) draws current from BOTH ends if a break
// occurs, halving the worst-case run length but doubling the cable spend.
// Class B is a simple radial — full length, no redundancy.

export type LoopProtocol =
  | 'apollo-discovery'
  | 'apollo-soteria'
  | 'hochiki-esp'
  | 'notifier-clip'
  | 'notifier-opal'
  | 'simplex-idnet'
  | 'bosch-lsn'
  | 'pertronic'
  | 'gst'
  | 'generic';

export type LoopClass = 'A' | 'B';

export type CableSpec = {
  /** Conductor cross-section in mm². */
  csa_mm2: number;
  /** Resistance in ohms per kilometre per conductor at 20 °C (single conductor, not loop). */
  ohms_per_km: number;
  label: string;
};

// Common AU fire-alarm cable specs (single conductor, 20 °C). Loop math
// multiplies by 2 for the return path.
export const COMMON_CABLES: CableSpec[] = [
  { label: '1.5 mm² Cu (WS52W typical)',  csa_mm2: 1.5, ohms_per_km: 12.1 },
  { label: '2.5 mm² Cu',                   csa_mm2: 2.5, ohms_per_km: 7.41 },
  { label: '4.0 mm² Cu',                   csa_mm2: 4.0, ohms_per_km: 4.61 },
  { label: '1.0 mm² Cu (small SLC only)',  csa_mm2: 1.0, ohms_per_km: 18.1 },
];

export type LoopProtocolBudget = {
  protocol: LoopProtocol;
  /** Nominal supply voltage from FIP (V). */
  v_supply: number;
  /** Minimum acceptable voltage at the device (V). Below this, devices may not respond reliably. */
  v_min_device: number;
  /** Maximum number of addresses the protocol allows on a single SLC. */
  max_devices: number;
  /** Max recommended single-loop length in metres for typical 1.5 mm² cable. */
  typical_max_length_m: number;
};

export const PROTOCOL_BUDGETS: LoopProtocolBudget[] = [
  { protocol: 'apollo-discovery', v_supply: 24, v_min_device: 17, max_devices: 126, typical_max_length_m: 2000 },
  { protocol: 'apollo-soteria',   v_supply: 24, v_min_device: 17, max_devices: 126, typical_max_length_m: 2000 },
  { protocol: 'hochiki-esp',      v_supply: 24, v_min_device: 17, max_devices: 127, typical_max_length_m: 2000 },
  { protocol: 'notifier-clip',    v_supply: 24, v_min_device: 18, max_devices: 99,  typical_max_length_m: 3000 },
  { protocol: 'notifier-opal',    v_supply: 28, v_min_device: 19, max_devices: 159, typical_max_length_m: 3000 },
  { protocol: 'simplex-idnet',    v_supply: 30, v_min_device: 19, max_devices: 250, typical_max_length_m: 3000 },
  { protocol: 'bosch-lsn',        v_supply: 33, v_min_device: 24, max_devices: 254, typical_max_length_m: 1500 },
  { protocol: 'pertronic',        v_supply: 24, v_min_device: 17, max_devices: 250, typical_max_length_m: 2000 },
  { protocol: 'gst',              v_supply: 24, v_min_device: 18, max_devices: 242, typical_max_length_m: 1500 },
  { protocol: 'generic',          v_supply: 24, v_min_device: 18, max_devices: 99,  typical_max_length_m: 2000 },
];

export function getProtocolBudget(p: LoopProtocol): LoopProtocolBudget {
  return PROTOCOL_BUDGETS.find((b) => b.protocol === p) ?? PROTOCOL_BUDGETS[PROTOCOL_BUDGETS.length - 1];
}

export type LoopInput = {
  protocol: LoopProtocol;
  loopClass: LoopClass;
  /** Total cable length on the loop in metres (one-way for Class B; full ring for Class A). */
  length_m: number;
  /** Per-conductor resistance in ohms per km. */
  ohms_per_km: number;
  /** Number of devices on the loop. */
  device_count: number;
  /** Average device current draw at standby in mA. */
  avg_device_ma: number;
  /** Optional override: peak (alarm) current per device in mA. Defaults to 8× standby. */
  peak_device_ma?: number;
  /** Safety margin in % applied to total current. Default 20%. */
  safety_margin_pct?: number;
};

export type LoopResult = {
  budget: LoopProtocolBudget;
  /** Worst-case run length the supply has to push current through (m). */
  worst_case_length_m: number;
  /** Total cable resistance (one conductor, 20°C) on the worst-case path (Ω). */
  cable_resistance_ohm: number;
  /** Total current at standby (mA). */
  standby_ma: number;
  /** Total current at alarm (mA). */
  alarm_ma: number;
  /** Voltage drop at standby on worst-case path (V). */
  standby_drop_v: number;
  /** Voltage drop at alarm on worst-case path (V). */
  alarm_drop_v: number;
  /** Voltage at far-end device at standby (V). */
  v_end_standby: number;
  /** Voltage at far-end device at alarm (V). */
  v_end_alarm: number;
  /** Pass / warn / fail relative to protocol minimum. */
  status: 'pass' | 'warn' | 'fail';
  /** Headroom above the protocol minimum at alarm (V). Negative = fail. */
  headroom_v: number;
  /** Devices over the protocol cap. 0 = within limit. */
  over_device_cap: number;
  /** Human-readable working steps for the result panel. */
  workings: { label: string; value: string }[];
  warnings: string[];
};

export function calculateLoop(input: LoopInput): LoopResult {
  const budget = getProtocolBudget(input.protocol);

  const peakMa = input.peak_device_ma ?? input.avg_device_ma * 8;
  const safety = (input.safety_margin_pct ?? 20) / 100;

  // For Class A redundancy, in a single-fault break the supply drives both
  // halves from each end — worst case is half the loop. For Class B,
  // the full radial length applies.
  const worst_case_length_m =
    input.loopClass === 'A' ? input.length_m / 2 : input.length_m;

  const km = worst_case_length_m / 1000;
  const cable_r_one_conductor = km * input.ohms_per_km;

  const standby_ma = input.device_count * input.avg_device_ma * (1 + safety);
  const alarm_ma   = input.device_count * peakMa             * (1 + safety);

  // V_drop = I * R * 2 (return path)
  const standby_drop_v = (standby_ma / 1000) * cable_r_one_conductor * 2;
  const alarm_drop_v   = (alarm_ma   / 1000) * cable_r_one_conductor * 2;
  const v_end_standby  = budget.v_supply - standby_drop_v;
  const v_end_alarm    = budget.v_supply - alarm_drop_v;
  const headroom_v     = v_end_alarm - budget.v_min_device;

  let status: LoopResult['status'];
  if (v_end_alarm < budget.v_min_device) status = 'fail';
  else if (headroom_v < 1.0)             status = 'warn';
  else                                   status = 'pass';

  const over_device_cap = Math.max(0, input.device_count - budget.max_devices);
  const warnings: string[] = [];
  if (over_device_cap > 0) {
    warnings.push(`Device count ${input.device_count} exceeds protocol limit (${budget.max_devices}). Add a second loop.`);
  }
  if (input.length_m > budget.typical_max_length_m) {
    warnings.push(`Loop length ${input.length_m} m exceeds typical ${budget.typical_max_length_m} m for this protocol on 1.5 mm² cable. Specify higher CSA or split.`);
  }

  return {
    budget,
    worst_case_length_m,
    cable_resistance_ohm: cable_r_one_conductor,
    standby_ma,
    alarm_ma,
    standby_drop_v,
    alarm_drop_v,
    v_end_standby,
    v_end_alarm,
    status,
    headroom_v,
    over_device_cap,
    workings: [
      { label: 'Protocol',                value: `${budget.protocol} — supply ${budget.v_supply} V, device floor ${budget.v_min_device} V` },
      { label: 'Worst-case length',       value: `${worst_case_length_m.toFixed(0)} m  (${input.loopClass === 'A' ? 'Class A: half of total' : 'Class B: full radial'})` },
      { label: 'Cable resistance / cond.', value: `${cable_r_one_conductor.toFixed(2)} Ω at 20 °C` },
      { label: 'Total standby load',      value: `${standby_ma.toFixed(0)} mA (incl. ${(safety * 100).toFixed(0)}% safety)` },
      { label: 'Total alarm load',        value: `${alarm_ma.toFixed(0)} mA` },
      { label: 'Voltage drop @ standby',  value: `${standby_drop_v.toFixed(2)} V (×2 conductors)` },
      { label: 'Voltage drop @ alarm',    value: `${alarm_drop_v.toFixed(2)} V` },
      { label: 'Voltage at far device',   value: `standby ${v_end_standby.toFixed(2)} V · alarm ${v_end_alarm.toFixed(2)} V` },
      { label: 'Headroom above floor',    value: `${headroom_v >= 0 ? '+' : ''}${headroom_v.toFixed(2)} V at alarm` },
    ],
    warnings,
  };
}
