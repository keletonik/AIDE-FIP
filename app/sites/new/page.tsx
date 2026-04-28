import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { SiteForm } from './SiteForm';

export const metadata = { title: 'New site' };
export const dynamic = 'force-dynamic';

export default async function NewSitePage() {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role === 'viewer') redirect('/sites');
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-head">New site</h1>
      <SiteForm />
    </div>
  );
}
