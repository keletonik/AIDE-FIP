'use client';

import { useEffect, useState } from 'react';

// Boot splash. Plays once per browser tab on cold load. Intentionally
// pretty — but bounded to ~1.1 s so the field UI never feels slow on a
// good connection. The animation is a small homage to a panel polling
// its addressable loop: a dot pulses, three rings emanate, and the
// status text cycles through the boot sequence.

const STATUS = [
  'initialising',
  'polling loop 1',
  'polling loop 2',
  'syncing reference data',
  'ready',
];

const TOTAL_MS = 1100;
const OUT_MS   = 280;

export function Splash({ force = false }: { force?: boolean }) {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    // Skip on subsequent navigations within the same tab unless forced
    // (the /brand demo button forces it so designers can replay).
    if (!force) {
      try {
        if (sessionStorage.getItem('aide.splashed') === '1') {
          setPhase('gone');
          return;
        }
        sessionStorage.setItem('aide.splashed', '1');
      } catch {
        // Storage blocked (private mode etc.) — fall through and play.
      }
    }

    const stepMs = TOTAL_MS / STATUS.length;
    const interval = setInterval(() => {
      setStageIdx((i) => {
        const next = i + 1;
        if (next >= STATUS.length) {
          clearInterval(interval);
          return STATUS.length - 1;
        }
        return next;
      });
    }, stepMs);

    const out = setTimeout(() => setPhase('out'),  TOTAL_MS);
    const end = setTimeout(() => setPhase('gone'), TOTAL_MS + OUT_MS);

    return () => { clearInterval(interval); clearTimeout(out); clearTimeout(end); };
  }, [force]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`splash ${phase === 'out' ? 'splash-out' : 'splash-in'}`}
      role="status"
      aria-label="Loading AIDE-FIP"
    >
      <div className="splash-stack">
        <div className="splash-pulse" aria-hidden="true">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="ring r3" />
          <span className="dot" />
        </div>

        <div className="splash-wordmark">
          <span>AIDE</span>
          <span className="splash-dot" aria-hidden="true">·</span>
          <span>FIP</span>
        </div>

        <div className="splash-status" aria-live="polite">
          <span className="splash-status-text">{STATUS[stageIdx]}</span>
          <span className="splash-ellipsis" aria-hidden="true">
            <i /><i /><i />
          </span>
        </div>
      </div>
    </div>
  );
}
