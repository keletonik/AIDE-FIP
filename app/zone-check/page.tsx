import { ZoneCheckClient } from './ZoneCheckClient';

export const dynamic = 'force-static';

export default function ZoneCheckPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">Zone-area check — AS 1670.1 §4.3</h1>
        <p className="text-muted text-sm mt-1">
          Sanity check zone count for a building before commissioning or handover. The standard caps
          a single zone at 2000 m² (1000 m² for sleeping risk), one zone per floor, plus mandatory
          splits for every stair, lift shaft, riser, plant room and roof void.
        </p>
      </header>
      <ZoneCheckClient />
    </div>
  );
}
