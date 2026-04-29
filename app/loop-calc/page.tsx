import { LoopCalcClient } from './LoopCalcClient';

export const dynamic = 'force-static';

export default function LoopCalcPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-head">Loop voltage-drop calculator</h1>
        <p className="text-muted text-sm mt-1">
          Estimate worst-case loop voltage at the far device. Pure cable physics — does not replace
          the panel manufacturer's design tool. Engineering judgement still applies.
        </p>
      </header>
      <LoopCalcClient />
    </div>
  );
}
