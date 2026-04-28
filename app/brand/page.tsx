import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { BrandTester } from './BrandTester';
import { SplashDemo } from './SplashDemo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Brand workshop' };

// Internal design tool — admins only. Loads Google Fonts directly so we can
// preview lots of typefaces without dragging them all into next/font's
// bundle. Deliberately a separate page from the public app so the font
// payload doesn't slow down the field UI.
const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Archivo:wght@400..900' +
  '&family=DM+Sans:wght@400..800' +
  '&family=Geist:wght@400..800' +
  '&family=Geist+Mono:wght@400..700' +
  '&family=IBM+Plex+Mono:wght@400;500;600;700' +
  '&family=IBM+Plex+Sans:wght@400;500;600;700' +
  '&family=Inter+Tight:wght@400..800' +
  '&family=JetBrains+Mono:wght@400..700' +
  '&family=Manrope:wght@400..800' +
  '&family=Outfit:wght@400..800' +
  '&family=Sora:wght@400..700' +
  '&family=Space+Grotesk:wght@400..700' +
  '&family=Space+Mono:wght@400;700' +
  '&display=swap';

export default async function BrandPage() {
  const me = await currentUser();
  if (!me) redirect('/login');
  if (me.role !== 'admin') redirect('/sites');

  return (
    <>
      <link rel="stylesheet" href={FONT_HREF} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      <div className="space-y-8">
        <nav className="flex gap-2">
          <Link className="btn" href="/admin/audit">Admin</Link>
          <Link className="btn" href="/sites">Sites</Link>
        </nav>

        <BrandTester />

        <hr className="border-line" />

        <SplashDemo />
      </div>
    </>
  );
}
