# Prepium — Android APK & Native Project Guide

This project has been converted into a native Android project using **Capacitor** and is also fully installable as an Android PWA.

---

## 📱 Method 1: Instant Install on Android (PWA / WebAPK — No Build Required)
You can install Prepium immediately on any Android phone without compiling code:
1. Open the shared app URL in **Google Chrome** on your Android device:
   ```
   https://ais-pre-7lkdhppwwqpzh3o2voo6nz-726609796299.asia-northeast1.run.app
   ```
2. Tap the **"Install App"** button at the top of Prepium (or tap Chrome's three-dot menu `⋮` and select **"Add to Home screen"** / **"Install app"**).
3. The app installs directly onto your phone launcher and app drawer with the Prepium icon, full-screen offline mode, and native behavior.

---

## 🛠️ Method 2: Generate APK via Android Studio (Local Machine)
The native Android project is generated in the `/android` directory.

### Prerequisites:
- [Android Studio](https://developer.android.com/studio) installed.
- Node.js (v18+) installed.

### Steps:
1. Clone / download this project to your computer.
2. Install dependencies and sync web build:
   ```bash
   npm install
   npm run cap:build
   ```
3. Open the Android project in Android Studio:
   ```bash
   npm run cap:open
   ```
   *(Or open the `android/` directory directly in Android Studio)*
4. In Android Studio:
   - Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - Once completed, click **locate** to find `app-debug.apk` in:
     `android/app/build/outputs/apk/debug/app-debug.apk`.
5. Transfer `app-debug.apk` to your Android device and tap to install!

---

## ⚡ Method 3: Command-Line APK Generation (Terminal)
If you have Android SDK and JDK 17 configured on your machine:
```bash
# 1. Build the web dist and sync
npm run cap:build

# 2. Compile APK with Gradle wrapper
cd android
./gradlew assembleDebug
```
The APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🚀 Method 4: Automated Cloud APK Build via GitHub Actions
A GitHub Actions workflow is included at `.github/workflows/build-apk.yml`.
1. Push this repository to GitHub.
2. Go to the **Actions** tab in your GitHub repository.
3. Select **Build Android APK** and click **Run workflow**.
4. When finished, download the **prepium-debug-apk** artifact containing `app-debug.apk`.

---

## ⚙️ Package Details
- **App Name**: Prepium
- **Package ID**: `com.prepium.app`
- **Main Activity**: `com.prepium.app.MainActivity`
- **Min Android SDK**: 22 (Android 5.1 Lollipop)
- **Target Android SDK**: 34 (Android 14)
