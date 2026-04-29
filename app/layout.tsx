import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { RequestTimer } from '@/components/RequestTimer';
import { Splash } from '@/components/Splash';
import { NativeBoot } from '@/components/NativeBoot';

export const metadata: Metadata = {
  title: { default: 'AIDE-FIP', template: '%s · AIDE-FIP' },
  description: 'Field reference, battery calculator and troubleshooting for Australian fire indicator panels.',
  applicationName: 'AIDE-FIP',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'AIDE-FIP', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#0b0d10',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

const swRegister = `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(()=>{}); }); }`;
const swUnregister = `if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); }`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        <NativeBoot />
        <Splash />
        <RequestTimer />
        <Nav />
        <main id="main" className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="max-w-6xl mx-auto px-4 py-10 text-sm text-muted print:hidden safe-bottom">
          AIDE-FIP — built for techs in the field. Standards remain copyright Standards Australia; this app links out, it does not reproduce.
        </footer>
        <script
          dangerouslySetInnerHTML={{ __html: isProd ? swRegister : swUnregister }}
        />
      </body>
    </html>
  );
}
