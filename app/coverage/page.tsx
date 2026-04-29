import { CoverageClient } from './CoverageClient';

export const dynamic = 'force-static';

export default function CoveragePage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">Sounder + strobe coverage</h1>
        <p className="text-muted text-sm mt-1">
          Quick check on speaker SPL at distance and strobe candela for room size. Estimates only —
          STI compliance per AS 1670.4 requires a calibrated sound level meter and a competent person.
        </p>
      </header>
      <CoverageClient />
    </div>
  );
}
