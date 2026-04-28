import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sitePanels, sites } from '@/lib/sites';
import { detectors } from '@/lib/detectors';
import { DetectorsEditor } from './DetectorsEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panel detectors' };

export default async function PanelDetectorsPage({ params }: { params: Promise<{ id: string; panelId: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id, panelId } = await params;
  const siteId = parseInt(id, 10);
  const sp = sitePanels.get(parseInt(panelId, 10));
  const site = sites.get(siteId);
  if (!site || !sp || sp.site_id !== siteId) notFound();
  const list = detectors.forPanel(sp.id);
  return (
    <div className="space-y-4">
      <Link href={`/sites/${siteId}/panels`} className="text-sm text-muted no-underline">← {site.name} · panels</Link>
      <h1 className="text-2xl font-bold text-head">{sp.label} — detectors</h1>
      <DetectorsEditor sitePanelId={sp.id} siteId={siteId} initial={list} canEdit={me.role !== 'viewer'} />
    </div>
  );
}
