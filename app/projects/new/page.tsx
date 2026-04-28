import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sites } from '@/lib/sites';
import { ProjectNewForm } from './ProjectNewForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New project' };

export default async function NewProjectPage() {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role === 'viewer') redirect('/projects');
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-head">New battery project</h1>
      <ProjectNewForm sites={sites.list()} />
    </div>
  );
}
