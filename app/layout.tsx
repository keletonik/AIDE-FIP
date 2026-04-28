import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { RequestTimer } from '@/components/RequestTimer';

export const metadata: Metadata = {
  title: { default: 'AIDE-FIP', template: '%s · AIDE-FIP' },
  description: 'Field reference, battery calculator and troubleshooting for Australian fire indicator panels.',
  applicationName: 'AIDE-FIP',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'AIDE-FIP', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0b0d10',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <RequestTimer />
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="max-w-6xl mx-auto px-4 py-10 text-sm text-muted print:hidden">
          AIDE-FIP — built for techs in the field. Standards remain copyright Standards Australia; this app links out, it does not reproduce.
        </footer>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); }); }`,
          }}
        />
      </body>
    </html>
  );
}
