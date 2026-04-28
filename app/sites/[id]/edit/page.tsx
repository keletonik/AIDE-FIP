import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { SiteForm } from '../../new/SiteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit site' };

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role === 'viewer') redirect('/sites');
  const { id } = await params;
  const site = sites.get(parseInt(id, 10));
  if (!site) notFound();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-head">Edit site</h1>
      <SiteForm initial={{
        id: site.id,
        name: site.name,
        address: site.address ?? '',
        suburb: site.suburb ?? '',
        postcode: site.postcode ?? '',
        contact_name: site.contact_name ?? '',
        contact_phone: site.contact_phone ?? '',
        notes: site.notes ?? '',
      }} />
    </div>
  );
}
