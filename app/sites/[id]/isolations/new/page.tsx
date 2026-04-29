import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites, sitePanels } from '@/lib/sites';
import { IsolationForm } from './IsolationForm';

export const dynamic = 'force-dynamic';

export default async function NewIsolationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role === 'viewer') redirect(`/sites/${(await params).id}/isolations`);
  const { id } = await params;
  const siteId = parseInt(id, 10);
  if (!Number.isFinite(siteId)) notFound();
  const site = sites.get(siteId);
  if (!site) notFound();

  const sps = sitePanels.forSite(siteId);

  return (
    <article className="space-y-4 max-w-xl">
      <Link href={`/sites/${siteId}/isolations`} className="text-sm text-muted no-underline">← Isolations</Link>
      <header>
        <h1 className="text-2xl font-bold text-head">Log isolation — {site.name}</h1>
        <p className="text-muted text-sm mt-1">
          Document anything you disable. The active list will surface this until you mark it restored,
          so you cannot leave site with a forgotten isolation.
        </p>
      </header>
      <IsolationForm siteId={siteId} panels={sps.map(p => ({ id: p.id, label: p.label }))} />
    </article>
  );
}
