import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { ceMatrices } from '@/lib/cematrix';
import { CEMatrixEditor } from './CEMatrixEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cause and effect' };

export default async function CEPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const me = await currentUser();
  if (!me) redirect('/login');
  const { id } = await params;
  const sp = await searchParams;
  const siteId = parseInt(id, 10);
  const site = sites.get(siteId);
  if (!site) notFound();

  const all = ceMatrices.forSite(siteId);
  const active = sp.id ? all.find(m => m.id === parseInt(sp.id!, 10)) : all[0];

  return (
    <div className="space-y-4">
      <Link href={`/sites/${siteId}`} className="text-sm text-muted no-underline">← {site.name}</Link>
      <h1 className="text-2xl font-bold text-head">Cause and effect — {site.name}</h1>
      <CEMatrixEditor siteId={siteId} all={all} active={active} canEdit={me.role !== 'viewer'} />
    </div>
  );
}
