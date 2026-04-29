// Capacitor native-platform detection and bootstrap. All Capacitor calls
// are dynamic-imported so the web build doesn't pull native code into the
// browser bundle when we're not on a device.

import type { ImpactStyle } from '@capacitor/haptics';

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  // Capacitor sets `Capacitor` global on the window
  return Boolean((window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
}

export async function initNativeShell(): Promise<void> {
  if (!isNative()) return;
  try {
    const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/app'),
    ]);

    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setBackgroundColor?.({ color: '#0b0d10' }).catch(() => {});

    // Hide splash once the web layer is interactive
    setTimeout(() => { SplashScreen.hide().catch(() => {}); }, 600);

    // Hardware back-button: pop history if there is any, else minimize
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.minimizeApp?.().catch(() => {});
    });
  } catch {
    // dynamic import failed (web build) — silent no-op
  }
}

export async function takePhoto(): Promise<{ blob: Blob; mime: string } | null> {
  if (!isNative()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      saveToGallery: false,
    });
    if (!photo.webPath) return null;
    const r = await fetch(photo.webPath);
    const blob = await r.blob();
    return { blob, mime: blob.type || `image/${photo.format ?? 'jpeg'}` };
  } catch {
    return null;
  }
}

export async function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map: Record<string, ImpactStyle> = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] }).catch(() => {});
  } catch {/* no-op on web */}
}

export type { ImpactStyle };
