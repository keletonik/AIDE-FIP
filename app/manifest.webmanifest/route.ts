// Served at /manifest.webmanifest. Kept as a route handler so we can read
// env vars at request time without baking them into a static file.
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    id: '/',
    name: 'AIDE-FIP',
    short_name: 'AIDE-FIP',
    description: 'Fire indicator panel field reference, battery calc and troubleshooting.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0b0d10',
    theme_color: '#0b0d10',
    categories: ['utilities', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }, { headers: { 'Cache-Control': 'public, max-age=300, must-revalidate' }});
}
