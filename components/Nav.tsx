import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { UserPill } from './UserPill';

const items = [
  { href: '/',             label: 'Home',          guard: 'open' },
  { href: '/sites',        label: 'Sites',         guard: 'auth' },
  { href: '/defects',      label: 'Defects',       guard: 'auth' },
  { href: '/isolations',   label: 'Isolations',    guard: 'auth' },
  { href: '/projects',     label: 'Projects',      guard: 'auth' },
  { href: '/triage',       label: 'Triage',        guard: 'open' },
  { href: '/standards',    label: 'Standards',     guard: 'open' },
  { href: '/panels',       label: 'Panels',        guard: 'open' },
  { href: '/tools',        label: 'Tools',         guard: 'open' },
  { href: '/ce-templates', label: 'C&E',           guard: 'open' },
  { href: '/troubleshoot', label: 'Troubleshoot',  guard: 'open' },
] as const;

export async function Nav() {
  const me = await currentUser().catch(() => null);
  const visible = items.filter(i => i.guard === 'open' || me);
  return (
    <header className="border-b border-line bg-slate sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate/85 print:hidden safe-top">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <Link href="/" className="font-bold text-head no-underline shrink-0">
          AIDE<span className="text-amber">·</span>FIP
        </Link>
        <nav aria-label="Primary" className="flex gap-1 overflow-x-auto whitespace-nowrap text-sm -mx-2 px-2 scrollbar-thin">
          {visible.map(i => (
            <Link key={i.href} href={i.href} className="px-3 py-2.5 rounded-md text-body hover:bg-line no-underline inline-flex items-center min-h-[44px]">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto shrink-0"><UserPill user={me} /></div>
      </div>
    </header>
  );
}
