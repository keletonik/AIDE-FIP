import { panels } from '@/lib/repos';
import { BatteryForm } from './BatteryForm';

export const metadata = { title: 'Battery calc' };
export const dynamic = 'force-dynamic';

export default async function BatteryPage({ searchParams }: { searchParams: Promise<{ panel?: string }> }) {
  const sp = await searchParams;
  const list = panels.list();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-head">Battery calculator</h1>
      <p className="text-muted text-sm">
        Sizes the FIP standby battery bank: nominated standby hours plus alarm minutes from the same bank,
        scaled by an ageing factor. Defaults follow common Australian commercial design intent — adjust to suit
        the project brief.
      </p>
      <BatteryForm panels={list} initial={sp?.panel} />
    </div>
  );
}
