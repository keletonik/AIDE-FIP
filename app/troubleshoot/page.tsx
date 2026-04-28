import { listSymptoms } from '@/lib/troubleshoot';
import { TroubleshootClient } from './TroubleshootClient';

export const metadata = { title: 'Troubleshoot' };
export const dynamic = 'force-dynamic';

export default function TroubleshootPage() {
  const symptoms = listSymptoms();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-head">Troubleshoot</h1>
      <p className="text-muted text-sm">Pick a symptom or type a keyword. Causes are ranked by what's actually most likely on Australian sites — not the manual's order.</p>
      <TroubleshootClient initialSymptoms={symptoms} />
    </div>
  );
}
