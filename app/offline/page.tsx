export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-head">You're offline.</h1>
      <p className="text-body">
        AIDE-FIP cached what you've already opened. Pages you haven't visited yet on this device
        will load when you've got signal again.
      </p>
      <p className="text-muted text-sm">
        Tip: open Standards, Panels and Battery once on Wi-Fi before you leave the office.
        That seeds the cache for the panel cupboard.
      </p>
    </div>
  );
}
