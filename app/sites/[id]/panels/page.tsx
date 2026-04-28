import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites, sitePanels } from '@/lib/sites';
import { panels as panelRepo } from '@/lib/repos';
import { SitePanelsEditor } from './SitePanelsEditor';

export const dynamic = 'force-dynamic';

export default async function SitePanelsPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = sites.get(siteId);
  if (!site) notFound();

  const sps = sitePanels.forSite(siteId);
  const known = panelRepo.list();

  return (
    <div className="space-y-4">
      <Link href={`/sites/${siteId}`} className="text-sm text-muted no-underline">← {site.name}</Link>
      <h1 className="text-2xl font-bold text-head">Panels at {site.name}</h1>
      <SitePanelsEditor siteId={siteId} initial={sps} catalogue={known.map(p => ({ slug: p.slug, name: p.name }))} canEdit={me.role !== 'viewer'} />
    </div>
  );
}
