# FOS Bar Android APK - Build-Anleitung

## Übersicht

Diese Anleitung beschreibt die Schritte zum Bauen der FOS Bar Android APK aus dem Quellcode.

## Status: Bereit für Build ✅

Alle 3 Phasen der Android-Conversion sind abgeschlossen:
- ✅ **Phase 1**: Capacitor-Projekt initialisiert
- ✅ **Phase 2**: Android Backup-System implementiert
- ✅ **Phase 3**: Android UI/UX-Anpassungen

## Voraussetzungen

### Software installieren

1. **Node.js & NPM** (LTS Version)
   - Download: https://nodejs.org/
   - Prüfen: `node --version` (sollte >= 18.0 sein)
   - Prüfen: `npm --version` (sollte >= 9.0 sein)

2. **Android Studio**
   - Download: https://developer.android.com/studio
   - Installiere Android SDK (API Level 33 oder höher empfohlen)
   - Installiere Android SDK Build-Tools
   - Konfiguriere Android SDK Path in den Einstellungen

3. **Java Development Kit (JDK) 17**
   - Download: https://adoptium.net/
   - Installiere JDK 17 (Temurin empfohlen)
   - Setze JAVA_HOME Umgebungsvariable:
     ```
     Windows: JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x
     macOS: JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
     Linux: JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64
     ```

### Umgebungsvariablen setzen

**Windows**:
```powershell
# JAVA_HOME
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"

# ANDROID_HOME
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"

# PATH erweitern
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools"
```

**macOS/Linux**:
```bash
# In ~/.bashrc oder ~/.zshrc
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

## Build-Schritte

### Schritt 1: Dependencies installieren

```bash
cd "C:/Users/mtnhu/OneDrive - Bildungsdirektion/#Unterricht/Programme/FOS Bar"
npm install
```

**Erwartete Ausgabe**:
```
added 150 packages, and audited 151 packages in 30s
```

**Installierte Pakete**:
- @capacitor/core@5.0.0
- @capacitor/cli@5.0.0
- @capacitor/android@5.0.0
- @capacitor/filesystem@5.0.0
- @capacitor/app@5.0.0
- @capacitor/status-bar@5.0.0
- @capacitor/share@5.0.0

### Schritt 2: Android-Plattform hinzufügen

```bash
npx cap add android
```

**Erwartete Ausgabe**:
```
✔ Adding native android project in android in 2.00s
✔ Syncing Gradle in 5.00s
✔ add in 7.50s
```

**Was wird erstellt**:
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/
│   │       └── res/
│   └── build.gradle
├── gradle/
├── build.gradle
└── settings.gradle
```

**Wichtig**: Das `android/` Verzeichnis ist in `.gitignore` und wird lokal erstellt.

### Schritt 3: Web-Assets synchronisieren

```bash
npx cap sync
```

**Erwartete Ausgabe**:
```
✔ Copying web assets from www to android/app/src/main/assets/public in 500ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 50ms
✔ copy android in 550ms
✔ Updating Android plugins in 100ms
✔ update android in 650ms
✔ Syncing Gradle in 5.00s
✔ sync in 6.20s
```

**Was wird kopiert**:
- www/index.html → android/app/src/main/assets/public/
- www/manager.html → android/app/src/main/assets/public/
- www/app.js → android/app/src/main/assets/public/
- www/backup-android.js → android/app/src/main/assets/public/
- www/app-android.js → android/app/src/main/assets/public/
- Alle anderen Dateien aus www/

### Schritt 4: Android Studio öffnen

```bash
npx cap open android
```

**Oder manuell**:
1. Öffne Android Studio
2. **Open** → Navigiere zu `FOS Bar/android/`
3. Warte auf Gradle Sync (kann 2-5 Minuten dauern)

### Schritt 5: Gradle Sync abwarten

**Automatisch beim Öffnen**:
- Android Studio führt automatisch Gradle Sync durch
- Status in der unteren Statusleiste sichtbar
- Bei Problemen: **File > Invalidate Caches / Restart**

**Mögliche Gradle-Downloads**:
- Gradle Wrapper (~100 MB)
- Android Build Tools (~500 MB)
- Dependencies (~200 MB)

### Schritt 6: Debug-APK bauen

**In Android Studio**:
1. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Warte auf Build-Prozess (1-3 Minuten beim ersten Mal)
3. Popup erscheint: "APK(s) generated successfully"
4. Klicke auf "locate" um APK zu finden

**Via Kommandozeile**:
```bash
cd android
./gradlew assembleDebug
```

**APK-Speicherort**:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**APK-Größe**: ~5-10 MB

### Schritt 7: APK installieren & testen

**Option A: Android-Gerät via USB**:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B: Android-Emulator**:
1. Starte Emulator in Android Studio (**AVD Manager**)
2. Ziehe APK auf Emulator-Fenster
3. Oder: `adb install app-debug.apk`

**Option C: Direkter Transfer**:
1. Kopiere `app-debug.apk` auf Android-Gerät
2. Öffne Datei-Manager auf Gerät
3. Tippe auf APK
4. Aktiviere "Aus unbekannten Quellen installieren"
5. Installiere App

## Release-APK bauen (Signiert)

Für Produktion sollte eine signierte Release-APK erstellt werden.

### Schritt 1: Signing Key generieren

```bash
keytool -genkey -v -keystore fos-bar.keystore \
  -alias fos-bar \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Eingabe-Prompt**:
- Password: [Wähle sicheres Passwort]
- Name: [Dein Name]
- Organisation: [Optional]
- Stadt: [Optional]
- Land: DE

**Ergebnis**: `fos-bar.keystore` Datei im aktuellen Verzeichnis

**Wichtig**:
- Keystore sicher aufbewahren!
- Passwort notieren!
- Ohne Keystore können Updates nicht veröffentlicht werden!

### Schritt 2: Signing-Konfiguration

**Erstelle**: `android/key.properties`
```properties
storeFile=../fos-bar.keystore
storePassword=DEIN_PASSWORT
keyAlias=fos-bar
keyPassword=DEIN_PASSWORT
```

**Aktualisiere**: `android/app/build.gradle`
```gradle
// Am Anfang hinzufügen
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Schritt 3: Release-APK bauen

```bash
cd android
./gradlew assembleRelease
```

**APK-Speicherort**:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Umbenennen**:
```bash
cp android/app/build/outputs/apk/release/app-release.apk FOS-Bar-v1.0.0.apk
```

## Versionierung

**Version erhöhen in**:

1. **package.json**:
```json
{
  "version": "1.0.0"
}
```

2. **android/app/build.gradle**:
```gradle
android {
    defaultConfig {
        versionCode 1       // Erhöhen bei jedem Release
        versionName "1.0.0" // Semantic Versioning
    }
}
```

**Semantic Versioning**:
- `1.0.0` → Erste Release-Version
- `1.0.1` → Bug-Fix
- `1.1.0` → Neue Features
- `2.0.0` → Breaking Changes

## Troubleshooting

### Problem: "JAVA_HOME is not set"

**Lösung**:
```bash
# Windows
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"

# macOS/Linux
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

Dann Terminal neu starten.

### Problem: "SDK location not found"

**Lösung**:
Erstelle `android/local.properties`:
```properties
sdk.dir=C:\\Users\\USERNAME\\AppData\\Local\\Android\\Sdk
```

### Problem: Gradle Sync schlägt fehl

**Lösung**:
1. **File > Invalidate Caches / Restart**
2. Prüfe Internet-Verbindung
3. Prüfe Gradle-Version in `android/gradle/wrapper/gradle-wrapper.properties`
4. Lösche `android/.gradle/` und `.idea/`
5. Sync erneut

### Problem: "Unsupported class file major version"

**Ursache**: Falsche Java-Version

**Lösung**:
```bash
java -version
# Muss JDK 17 sein!
```

Falls falsche Version: JAVA_HOME neu setzen und Gradle Sync erneut.

### Problem: APK installiert nicht auf Gerät

**Lösung**:
1. Aktiviere "Aus unbekannten Quellen installieren"
2. Deinstalliere alte Version (falls vorhanden)
3. Prüfe ob genug Speicherplatz vorhanden ist
4. Prüfe APK-Signatur (Debug vs. Release)

### Problem: App startet aber zeigt weiße Seite

**Ursache**: Web-Assets nicht synchronisiert

**Lösung**:
```bash
npx cap sync
# Dann APK neu bauen
```

### Problem: Backup funktioniert nicht in APK

**Ursache**: Capacitor Plugins nicht korrekt geladen

**Lösung**:
1. Prüfe Browser-Konsole (USB Debugging)
2. Stelle sicher dass `npx cap sync` ausgeführt wurde
3. Prüfe ob `backup-android.js` in APK vorhanden ist

## Testing

### USB Debugging aktivieren

**Android-Gerät**:
1. **Einstellungen > Über das Telefon**
2. Tippe 7x auf "Build-Nummer"
3. **Einstellungen > Entwickleroptionen**
4. Aktiviere "USB-Debugging"

**Verbinden**:
```bash
adb devices
# List of devices attached
# ABC123456789    device
```

### Logs anzeigen

```bash
# Alle Logs
adb logcat

# Nur FOS Bar Logs
adb logcat | grep "FOS Bar"

# Capacitor Logs
adb logcat | grep "Capacitor"

# JavaScript Fehler
adb logcat | grep "Console"
```

### Performance testen

**Chrome DevTools**:
1. Chrome öffnen
2. `chrome://inspect` öffnen
3. Gerät auswählen
4. **Inspect** klicken
5. Console, Network, Performance Tabs nutzen

## Checkliste vor Release

- [ ] Alle Features funktionieren
- [ ] Backup-System getestet (Auto-Backup + Restore)
- [ ] Alle Tabs getestet (Verkauf, Gutschriften, Schuldbuch, Manager)
- [ ] Back-Button Navigation getestet
- [ ] Status Bar Farbe korrekt
- [ ] App-Pause/Resume funktioniert
- [ ] Export/Import funktioniert
- [ ] Auf mehreren Android-Versionen getestet (8+)
- [ ] Performance akzeptabel (keine Lags)
- [ ] Keine Crashes im 1h-Test
- [ ] Version erhöht (versionCode + versionName)
- [ ] Release-APK signiert
- [ ] APK umbenennt (FOS-Bar-v1.0.0.apk)
- [ ] Changelog erstellt

## Nächste Schritte nach Build

1. **Testen auf Testgerät** (1-2 Tage Dauerbetrieb)
2. **User Acceptance Testing** (Feedback sammeln)
3. **Bug-Fixes** (falls nötig)
4. **Release vorbereiten** (Changelog, Screenshots)
5. **Distribution** (APK teilen oder Google Play)

## Ressourcen

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Developer**: https://developer.android.com/
- **Gradle Docs**: https://docs.gradle.org/
- **Projekt-Dokumentation**:
  - [ANDROID_SETUP.md](ANDROID_SETUP.md) - Setup-Anleitung
  - [PHASE1_CHANGES.md](siehe Commits) - Phase 1 Details
  - [PHASE2_CHANGES.md](PHASE2_CHANGES.md) - Phase 2 Details
  - [PHASE3_CHANGES.md](PHASE3_CHANGES.md) - Phase 3 Details

## Support

Bei Problemen:
1. Prüfe [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)
2. Prüfe Logs mit `adb logcat`
3. Prüfe Browser-Konsole (Chrome DevTools)
4. Erstelle Issue auf GitHub

---

**Viel Erfolg beim Bauen der APK!** 🚀
