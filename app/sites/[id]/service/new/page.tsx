import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { serviceTemplates } from '@/lib/services';
import { ServiceForm } from './ServiceForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New service record' };

export default async function NewServicePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role === 'viewer') redirect(`/sites/${(await params).id}`);
  const { id } = await params;
  const sp = await searchParams;
  const site = sites.get(parseInt(id, 10));
  if (!site) notFound();
  const templates = serviceTemplates.list();
  const initialId = sp.template ? parseInt(sp.template, 10) : templates[0]?.id ?? 0;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-head">Service record — {site.name}</h1>
      <ServiceForm siteId={site.id} templates={templates} initialTemplateId={initialId} />
    </div>
  );
}
