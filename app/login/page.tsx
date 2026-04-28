import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Login' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const me = await currentUser();
  if (me) redirect('/sites');
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-head">Login</h1>
      <LoginForm />
      <p className="text-muted text-sm">
        First time? <a href="/register">Set up the bootstrap admin →</a>
      </p>
    </div>
  );
}
