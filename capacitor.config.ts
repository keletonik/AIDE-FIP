import type { CapacitorConfig } from '@capacitor/cli';

// AIDE-FIP runs the Next.js server on Replit and the native shell points
// at it. Set AIDE_DEPLOY_URL in your environment before running
// `npx cap sync` so the iOS/Android builds know where to load from.
//
// In dev (without AIDE_DEPLOY_URL set), the apps point at localhost:3000
// — start `npm run dev` and use a tunnel (ngrok, replit dev URL) for
// device testing.

const deployUrl =
  process.env.AIDE_DEPLOY_URL ||
  process.env.NEXT_PUBLIC_AIDE_DEPLOY_URL ||
  'http://localhost:3000';

const replitHost = (() => {
  try { return new URL(deployUrl).host; } catch { return 'localhost'; }
})();

const config: CapacitorConfig = {
  appId: 'com.keletonik.aidefip',
  appName: 'AIDE-FIP',
  // Hybrid build: the native app loads the deployed Next.js server.
  webDir: 'public',
  server: {
    url: deployUrl,
    cleartext: deployUrl.startsWith('http://'),
    allowNavigation: [replitHost, '*.replit.app', '*.replit.dev'],
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0b0d10',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#0b0d10',
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0b0d10',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0d10',
      overlaysWebView: false,
    },
    Camera: {
      // iOS / Android usage strings — also need to be set in Info.plist
      // and AndroidManifest.xml; documented in IOS_ANDROID.md.
    },
  },
};

export default config;
