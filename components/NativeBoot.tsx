'use client';

import { useEffect } from 'react';
import { initNativeShell } from '@/lib/native';

// Mounts on every page in the root layout. No-op on web; on iOS/Android
// configures the status bar, hides the splash, wires hardware-back.
export function NativeBoot() {
  useEffect(() => {
    initNativeShell();
  }, []);
  return null;
}
