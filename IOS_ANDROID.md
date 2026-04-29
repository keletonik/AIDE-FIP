# Building AIDE-FIP for iOS and Android

The web app (Next.js + PWA) is wrapped with [Capacitor](https://capacitorjs.com/)
to produce native iOS (`.ipa`) and Android (`.apk`/`.aab`) builds. The webview
loads the deployed Replit URL — there is no local Next.js bundle on the device.
This is the standard "hybrid" pattern: 100% of the existing app reused, native
camera/status-bar/splash plugins for a native feel, distributable on both stores.

## What this gets you

- **Real installable apps.** App Store and Play Store distributable.
- **Native plugins.** Camera, photo library, status bar, splash screen,
  hardware back button (Android), haptics, network status.
- **Single codebase.** Every fix to the web app reaches both phones immediately
  after `npm run cap:sync` and a redeploy of Replit.
- **PWA still works.** Going to the URL in a browser still installs as a PWA.

## What this is NOT

- Not a native rewrite. The UI is the existing Next.js pages running inside
  WKWebView (iOS) / Chromium WebView (Android). Performance is excellent for a
  forms-and-tables app like this; not appropriate for 60fps games.
- Not offline. The webview talks to the Replit server. If the device has no
  connection, the app shell + offline page are shown (PWA cache), but
  authenticated data is not available offline. Changing this is a multi-week
  re-architecture (move SQLite to the device, sync to server).

## Prerequisites

| Target | Build host | SDK | Account |
|---|---|---|---|
| Android | Linux/macOS/Windows | Android Studio + Android SDK 34+ + JDK 17 | Google Play Console (US$25 one-time) |
| iOS | **macOS only** | Xcode 15+ + CocoaPods | Apple Developer Program (US$99/year) |

iOS builds **cannot** be produced on Linux or Windows. Use a Mac, a cloud Mac
(MacStadium, Codemagic, EAS Build), or a CI service with macOS runners
(GitHub Actions `macos-latest`).

## One-time setup

```bash
git clone https://github.com/keletonik/aide-fip
cd aide-fip
npm ci
```

Set the deployment URL the native shell will load:

```bash
export AIDE_DEPLOY_URL="https://your-replit-deploy.replit.app"
```

(Without this, the native app points at `http://localhost:3000` for dev.)

Sync the native projects with the latest config:

```bash
npm run cap:sync
```

## Android workflow

### Open in Android Studio

```bash
npm run cap:open:android
```

First open: Android Studio will sync Gradle (~2 min the first time).
If prompted, install the Android SDK 34+ build tools and platform.

### Run on a device or emulator

```bash
npm run cap:run:android
```

Or in Android Studio: **Run → Run 'app'**. Pick a connected device or emulator.

### Build a signed release APK / AAB

1. Generate an upload keystore (one-time, store the `.jks` file securely
   outside the repo):
   ```bash
   keytool -genkeypair -v -keystore aide-fip-upload.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias aide-fip
   ```
2. Add a `android/keystore.properties` (do NOT commit — it's gitignored):
   ```
   storeFile=/absolute/path/to/aide-fip-upload.jks
   storePassword=<keystore-password>
   keyAlias=aide-fip
   keyPassword=<key-password>
   ```
3. Wire it into `android/app/build.gradle` under `signingConfigs.release` (one
   file edit; Capacitor docs have the snippet:
   <https://capacitorjs.com/docs/android/deploying-to-google-play>).
4. Build:
   ```bash
   cd android
   ./gradlew bundleRelease     # produces app/build/outputs/bundle/release/app-release.aab
   ./gradlew assembleRelease   # produces app/build/outputs/apk/release/app-release.apk
   ```
5. Upload the `.aab` to Google Play Console (Internal Testing → Production).

## iOS workflow

### Open in Xcode (macOS required)

```bash
npm run cap:open:ios
```

First open: Xcode will install Pods (~3 min). Set the **Team** in
**App → Signing & Capabilities** to your Apple Developer Team.

### Run on a simulator or device

In Xcode: pick a scheme/destination and hit **▶ Run**. Connected device must
be registered in your Apple Developer account.

### Build for App Store

1. In Xcode: **Product → Archive**. (Set scheme to `App`, destination to
   *Any iOS Device*.)
2. Once archived: **Window → Organizer → Distribute App → App Store Connect**.
3. Sign with your distribution certificate; upload.
4. In App Store Connect: create a TestFlight build → submit for App Store review.

### CI alternative

If you don't have a Mac, use one of:

- **EAS Build** (Expo's cloud) — `eas build --platform ios` works with Capacitor projects with minor config.
- **Codemagic** / **Bitrise** — free macOS minutes, good Capacitor support.
- **GitHub Actions** with `macos-latest` runners — bring-your-own signing certs.

## Versioning

Each store release needs a unique version number. The web app's version is in
`package.json`. The native apps track their own:

- Android: `android/app/build.gradle` — `versionCode` (integer, must increase) and `versionName` (string).
- iOS: Xcode → App → General — `Version` and `Build`.

## App Store metadata you'll need

For both stores:
- App name: **AIDE-FIP**
- Bundle/package id: `com.keletonik.aidefip` (set in `capacitor.config.ts` —
  change before first store submission, then never)
- Category: Productivity / Business
- Privacy policy URL (mandatory)
- Screenshots: at least 3 per device size (iPhone 6.7", 5.5"; Android phone)
- Short description (~80 chars), long description (4000 chars)
- Support URL, marketing URL

The PWA icon set in `public/` is reused; the native splash uses
`#0b0d10` background per `capacitor.config.ts` and the icons under
`android/app/src/main/res/mipmap-*` and
`ios/App/App/Assets.xcassets/AppIcon.appiconset/` (Capacitor seeded these
from `public/icon-512.png`; replace with brand artwork before release).

## App Store review notes

Apple has historically rejected apps that are "thin wrappers" around a
website. Mitigations baked in here:

- Native plugins genuinely used: Camera, Status Bar, Splash, Haptics
- App provides function not available in a regular browser tab (camera capture,
  hardware back, native splash, install on home screen)
- Bundle id and signing distinct from a webview demo

If review pushes back, the typical answer is to add another genuinely-native
feature (offline cache of reference data, biometric login via Capacitor Face ID
plugin, etc).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Android: blank white screen | Check `AIDE_DEPLOY_URL` is reachable; rerun `npm run cap:sync`; check `adb logcat \| grep -i capacitor` |
| iOS: "Untrusted Developer" on first run | Settings → General → VPN & Device Management → trust your dev cert |
| `pod install` fails | `cd ios/App && pod repo update && pod install` |
| Camera doesn't open | Verify `NSCameraUsageDescription` (iOS) / `CAMERA` permission (Android) — already set in this repo |
| Server URL changed | Update `AIDE_DEPLOY_URL`, rerun `npm run cap:sync`, rebuild |
| Status bar overlaps content | `safe-top` / `safe-bottom` Tailwind classes already used; ensure they're applied to top/bottom elements |

## What lives where

```
capacitor.config.ts                # Bundle id, app name, server URL, plugin config
ios/                               # Xcode project (open in Xcode on macOS)
  App/App/Info.plist               # Permission strings (camera, photo library)
  App/App/Assets.xcassets/         # App icons, launch images
android/                           # Gradle project (open in Android Studio)
  app/src/main/AndroidManifest.xml # Permissions, intents
  app/src/main/res/                # Icons, theme, strings
lib/native.ts                      # Capacitor detection + status-bar / splash / camera bootstrap
components/NativeBoot.tsx          # Mounted in root layout; calls initNativeShell on iOS/Android
```
