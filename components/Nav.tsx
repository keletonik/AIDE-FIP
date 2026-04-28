import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { UserPill } from './UserPill';

const items = [
  { href: '/',             label: 'Home',          guard: 'open' },
  { href: '/sites',        label: 'Sites',         guard: 'auth' },
  { href: '/defects',      label: 'Defects',       guard: 'auth' },
  { href: '/projects',     label: 'Projects',      guard: 'auth' },
  { href: '/standards',    label: 'Standards',     guard: 'open' },
  { href: '/panels',       label: 'Panels',        guard: 'open' },
  { href: '/battery',      label: 'Battery',       guard: 'open' },
  { href: '/troubleshoot', label: 'Troubleshoot',  guard: 'open' },
] as const;

export async function Nav() {
  const me = await currentUser().catch(() => null);
  const visible = items.filter(i => i.guard === 'open' || me);
  return (
    <header className="border-b border-line bg-slate sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate/85 print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link href="/" className="font-bold text-head no-underline">
          AIDE<span className="text-amber">·</span>FIP
        </Link>
        <nav className="flex gap-1 flex-wrap text-sm">
          {visible.map(i => (
            <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-md text-body hover:bg-line no-underline">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto"><UserPill user={me} /></div>
      </div>
    </header>
  );
}
