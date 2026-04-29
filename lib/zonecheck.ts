// AS 1670.1 §4.3 zone-area / zone-count sanity check.
//
// Rules paraphrased:
//   - Maximum zone area: 2000 m² typical; 1000 m² for sleeping risk classes.
//   - One zone per floor (no zone may span more than one floor).
//   - Mandatory zone splits: each stair, each lift shaft, each riser /
//     service shaft, each plant room, each roof void.
//   - Total zone count includes the building's habitable area / max-area
//     plus the mandatory splits.

export type ZoneCheckInput = {
  /** Gross floor area, m². */
  floor_area_m2: number;
  /** Number of habitable floors (excluding roof / basement plant if separate). */
  floors: number;
  /** Sleeping-risk class (Class 2/3/9a/9c)? Caps zone area at 1000 m². */
  sleeping_risk: boolean;
  /** Number of stairs to be zoned separately. */
  stairs: number;
  /** Number of lift shafts to be zoned separately. */
  lift_shafts: number;
  /** Number of risers / service shafts to be zoned separately. */
  risers: number;
  /** Number of plant rooms to be zoned separately. */
  plant_rooms: number;
  /** Roof void counted? */
  roof_void: boolean;
};

export type ZoneCheckResult = {
  max_area_per_zone: number;
  area_zones_required: number;
  mandatory_split_zones: number;
  total_zones: number;
  warnings: string[];
  workings: { label: string; value: string }[];
};

export function checkZones(input: ZoneCheckInput): ZoneCheckResult {
  const max = input.sleeping_risk ? 1000 : 2000;
  const area = Math.max(0, input.floor_area_m2);
  const floors = Math.max(1, input.floors);

  // Per AS 1670.1, no zone may span more than one floor. Required area
  // zones is therefore at minimum (floors), or (area / max) — whichever is larger.
  const area_per_floor = area / floors;
  const zonesPerFloor = Math.ceil(area_per_floor / max);
  const area_zones_required = Math.max(floors, zonesPerFloor * floors);

  const mandatory_split_zones =
    input.stairs + input.lift_shafts + input.risers + input.plant_rooms + (input.roof_void ? 1 : 0);

  const total_zones = area_zones_required + mandatory_split_zones;

  const warnings: string[] = [];
  if (area_per_floor > max) {
    warnings.push(`Average area per floor ${area_per_floor.toFixed(0)} m² exceeds ${max} m² — split each floor into ${zonesPerFloor} zones.`);
  }
  if (input.stairs === 0 && floors > 1) {
    warnings.push('Multi-storey buildings need at least one stair zone — verify count.');
  }
  if (input.lift_shafts === 0 && floors > 1) {
    warnings.push('Buildings with lifts need a lift-shaft zone — verify count.');
  }

  return {
    max_area_per_zone: max,
    area_zones_required,
    mandatory_split_zones,
    total_zones,
    warnings,
    workings: [
      { label: 'AS 1670.1 §4.3 max zone area',  value: `${max} m² (${input.sleeping_risk ? 'sleeping risk' : 'general'})` },
      { label: 'Area per floor',                value: `${area_per_floor.toFixed(0)} m² (× ${floors} floors)` },
      { label: 'Area zones / floor',            value: `${zonesPerFloor}` },
      { label: 'Area zones total',              value: `${area_zones_required} (≥ floors)` },
      { label: 'Mandatory split zones',          value: `${mandatory_split_zones} (stairs + lifts + risers + plant${input.roof_void ? ' + roof void' : ''})` },
      { label: 'Total zones',                   value: `${total_zones}` },
    ],
  };
}
