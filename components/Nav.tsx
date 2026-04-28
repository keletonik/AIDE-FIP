import Link from 'next/link';

const items = [
  { href: '/',             label: 'Home' },
  { href: '/standards',    label: 'Standards' },
  { href: '/panels',       label: 'Panels' },
  { href: '/battery',      label: 'Battery calc' },
  { href: '/troubleshoot', label: 'Troubleshoot' },
  { href: '/products',     label: 'Products' },
];

export function Nav() {
  return (
    <header className="border-b border-line bg-slate sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate/85">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link href="/" className="font-bold text-head no-underline">
          AIDE<span className="text-amber">·</span>FIP
        </Link>
        <nav className="flex gap-1 flex-wrap text-sm">
          {items.map(i => (
            <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-md text-body hover:bg-line no-underline">
              {i.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto text-xs text-muted hidden sm:block">NSW · AS 1670 family</span>
      </div>
    </header>
  );
}
