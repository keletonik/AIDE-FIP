'use client';

import { useState } from 'react';
import { Splash } from '@/components/Splash';

export function SplashDemo() {
  const [n, setN] = useState(0);

  return (
    <section className="space-y-3">
      <h2 className="text-sm uppercase tracking-wide text-muted">Loading splash</h2>
      <p className="text-muted text-sm">
        Plays once per browser tab on cold load. Click replay to see it again — clears the session marker first.
        Honours <code className="kbd">prefers-reduced-motion</code>.
      </p>
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            try { sessionStorage.removeItem('aide.splashed'); } catch { /* ignore */ }
            setN(n + 1);
          }}
        >
          Replay splash
        </button>
        <span className="text-xs text-muted self-center">replay #{n}</span>
      </div>

      {/* Mounting with a key remounts the component on each replay so its
          internal state restarts cleanly. The `force` prop bypasses the
          session-storage skip in case storage is blocked. */}
      <Splash key={n} force={n > 0} />
    </section>
  );
}
