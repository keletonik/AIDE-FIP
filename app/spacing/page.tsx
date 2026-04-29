import { SpacingClient } from './SpacingClient';

export const dynamic = 'force-static';

export default function SpacingPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">Detector spacing — AS 1670.1</h1>
        <p className="text-muted text-sm mt-1">
          Quick grid-spacing sanity check for flat rectangular ceilings. Use as a starting point;
          obstructions, beams, joists, sloped or pitched ceilings all need separate consideration
          per AS 1670.1.
        </p>
      </header>
      <SpacingClient />
    </div>
  );
}
