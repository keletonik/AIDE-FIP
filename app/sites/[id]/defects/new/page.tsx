import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { DefectForm } from './DefectForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Raise defect' };

export default async function NewDefectPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role === 'viewer') redirect(`/sites/${(await params).id}`);
  const { id } = await params;
  const site = sites.get(parseInt(id, 10));
  if (!site) notFound();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-head">Raise defect — {site.name}</h1>
      <DefectForm siteId={site.id} />
    </div>
  );
}
