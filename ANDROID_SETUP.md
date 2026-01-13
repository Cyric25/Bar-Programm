# FOS Bar - Android App Setup

## Übersicht

Dieses Dokument beschreibt die Schritte zur Konvertierung der FOS Bar Web-Anwendung in eine Android APK mittels Capacitor.

## Status: Phase 1 Abgeschlossen ✅

- ✅ Capacitor-Projekt initialisiert
- ✅ package.json und capacitor.config.json erstellt
- ✅ www/ Verzeichnis mit allen Web-App-Dateien erstellt
- ⏳ NPM Dependencies installieren (nächster Schritt)
- ⏳ Android-Plattform hinzufügen (nächster Schritt)

## Voraussetzungen

### Software installieren

1. **Node.js und NPM**
   - Download: https://nodejs.org/ (LTS Version)
   - Prüfen: `node --version` und `npm --version`

2. **Android Studio**
   - Download: https://developer.android.com/studio
   - Installiere Android SDK (API Level 33 empfohlen)
   - Konfiguriere Android SDK path

3. **Java Development Kit (JDK) 17**
   - Download: https://adoptium.net/
   - Setze JAVA_HOME Umgebungsvariable

## Setup-Schritte

### Schritt 1: Dependencies installieren

```bash
npm install
```

Dies installiert alle Capacitor-Pakete:
- @capacitor/core
- @capacitor/cli
- @capacitor/android
- @capacitor/filesystem
- @capacitor/app
- @capacitor/status-bar
- @capacitor/share

### Schritt 2: Android-Plattform hinzufügen

```bash
npx cap add android
```

Dies erstellt:
- `android/` Verzeichnis mit nativer Android-Projekt-Struktur
- Gradle Build-Dateien
- AndroidManifest.xml

### Schritt 3: Web-Assets synchronisieren

```bash
npx cap sync
```

Kopiert www/ Dateien in das Android-Projekt.

### Schritt 4: Android Studio öffnen

```bash
npx cap open android
```

Öffnet das Android-Projekt in Android Studio.

### Schritt 5: APK bauen

In Android Studio:
1. Warte bis Gradle Sync abgeschlossen ist
2. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK wird erstellt in: `android/app/build/outputs/apk/debug/app-debug.apk`

## Projektstruktur

```
FOS Bar/
├── www/                          # Web-Root (Capacitor verwendet diese Dateien)
│   ├── index.html               # Hauptseite (Verkauf, Gutschriften, Schuldbuch)
│   ├── manager.html             # Manager-Seite (Verwaltung, Bilanz, Statistik)
│   ├── app.js                   # Haupt-Logik (2629 Zeilen)
│   ├── manager.js               # Manager-Logik (1341 Zeilen)
│   ├── backup.js                # Backup-System (601 Zeilen)
│   ├── styles.css               # Hauptstyles
│   ├── manager.css              # Manager-Styles
│   ├── products.json            # Produkt-Daten
│   └── persons.json             # Personen-Daten
├── android/                     # Android-Projekt (erstellt durch npx cap add android)
├── capacitor.config.json        # Capacitor-Konfiguration
├── package.json                 # NPM Dependencies
└── .gitignore                   # Git-Ignore (inkl. android/, node_modules/)
```

## App-Konfiguration

**App ID**: `com.fosbar.app`
**App Name**: `FOS Bar`
**Web-Root**: `www/`

Siehe `capacitor.config.json` für Details.

## Nächste Schritte (Phase 2)

Nach erfolgreicher APK-Erstellung in Phase 1:

1. **backup.js modifizieren** für Android Filesystem API
2. **File System Access API** durch Capacitor Filesystem ersetzen
3. **Auto-Backup** ins App-Verzeichnis implementieren
4. **Testing** der Backup/Restore-Funktionen

Details siehe: [Implementierungsplan](C:\Users\mtnhu\.claude\plans\golden-painting-horizon.md)

## Troubleshooting

### Problem: npm install schlägt fehl
**Lösung**: Prüfe Node.js Installation, lösche `node_modules/` und `package-lock.json`, führe `npm install` erneut aus.

### Problem: npx cap add android schlägt fehl
**Lösung**: Stelle sicher, dass Android Studio und Android SDK installiert sind. Setze `ANDROID_HOME` Umgebungsvariable.

### Problem: Gradle Sync schlägt fehl in Android Studio
**Lösung**:
- Prüfe JAVA_HOME (muss JDK 17 sein)
- **File > Invalidate Caches / Restart**
- Prüfe Internet-Verbindung (Gradle lädt Dependencies)

### Problem: APK lässt sich nicht installieren
**Lösung**:
- Aktiviere "Install from Unknown Sources" in Android-Einstellungen
- Prüfe ob eine ältere Version bereits installiert ist (deinstallieren)

## Wichtige Befehle

```bash
# Dependencies installieren
npm install

# Android-Plattform hinzufügen
npx cap add android

# Web-Assets synchronisieren (nach Änderungen in www/)
npx cap sync

# Android Studio öffnen
npx cap open android

# Capacitor-Plugins aktualisieren
npm update

# Build neu synchronisieren
npx cap sync android
```

## Ressourcen

- **Capacitor Dokumentation**: https://capacitorjs.com/docs
- **Capacitor Filesystem Plugin**: https://capacitorjs.com/docs/apis/filesystem
- **Android Studio Download**: https://developer.android.com/studio
- **Implementierungsplan**: `C:\Users\mtnhu\.claude\plans\golden-painting-horizon.md`

## Lizenz

Siehe [LICENSE](LICENSE) Datei für Details.
