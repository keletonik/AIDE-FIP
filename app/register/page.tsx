import { redirect } from 'next/navigation';
import { userCount, currentUser } from '@/lib/auth';
import { RegisterForm } from './RegisterForm';

export const metadata = { title: 'Register' };
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const total = userCount();
  const me = await currentUser();

  // Bootstrap path open until the first user exists. After that, only
  // admins can land here to create accounts for techs.
  if (total > 0 && (!me || me.role !== 'admin')) {
    redirect('/login');
  }

  const isBootstrap = total === 0;

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-head">{isBootstrap ? 'Create the bootstrap admin' : 'Add a user'}</h1>
      {isBootstrap && (
        <p className="text-muted text-sm">
          The first account becomes the system admin. Choose a strong password — there's no email reset wired up.
        </p>
      )}
      <RegisterForm bootstrap={isBootstrap} />
    </div>
  );
}
