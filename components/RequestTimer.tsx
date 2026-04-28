'use client';

import { useEffect } from 'react';

// Records page nav timing into the in-app debug ring buffer. No external
// telemetry — the debug dashboard reads this back from the server side.
export function RequestTimer() {
  useEffect(() => {
    const send = (path: string, dur: number) => {
      navigator.sendBeacon?.('/api/debug/log', JSON.stringify({
        kind: 'nav', path, dur, t: Date.now(),
      })) || fetch('/api/debug/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'nav', path, dur, t: Date.now() }),
        keepalive: true,
      }).catch(() => {});
    };

    const onLoad = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) send(location.pathname, Math.round(nav.duration));
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });

    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
