# Phase 2: Android Backup-System - Änderungen

## Übersicht

Phase 2 implementiert das native Android Backup-System mittels Capacitor Filesystem API.

## Status: Phase 2 Abgeschlossen ✅

- ✅ backup-android.js erstellt (Capacitor-Version)
- ✅ index.html aktualisiert (Capacitor Plugins eingebunden)
- ✅ manager.html aktualisiert (Capacitor Plugins eingebunden)
- ✅ File System Access API durch Capacitor Filesystem ersetzt

## Änderungen im Detail

### 1. Neue Datei: www/backup-android.js

**Ersetzt**: backup.js (für Android-Build)

**Hauptänderungen**:

#### Removed (Browser-spezifisch):
- ❌ `window.showDirectoryPicker()` - User-Ordner-Auswahl
- ❌ `dirHandle.getFileHandle()` - File Handle API
- ❌ `fileHandle.createWritable()` - Writable Stream API
- ❌ Setup-Banner und User-Interaktion für Ordner-Auswahl

#### Added (Capacitor Android):
- ✅ `Capacitor.Plugins.Filesystem.mkdir()` - Automatische Verzeichnis-Erstellung
- ✅ `Capacitor.Plugins.Filesystem.writeFile()` - Datei schreiben
- ✅ `Capacitor.Plugins.Filesystem.readFile()` - Datei lesen
- ✅ `Capacitor.Plugins.Filesystem.getUri()` - URI für Share-Dialog
- ✅ `Capacitor.Plugins.Share.share()` - Android Share-Integration
- ✅ Festes Backup-Verzeichnis: `Backup/` in `Directory.Data`

#### Backup-Speicherort:
```
Android: /data/data/com.fosbar.app/files/Backup/
├── db_produkte.json
├── db_gutschriften.json
├── db_schuldbuch.json
├── db_inventar.json
├── db_treuekarten.json
└── _backup_info.json
```

### 2. index.html Änderungen

**Zeilen modifiziert**: 400-420

**Vor**:
```html
<script src="backup.js"></script>
```

**Nach**:
```html
<!-- Capacitor Core & Plugins (Android) -->
<script type="module">
    // Capacitor Plugins global verfügbar machen
    if (typeof Capacitor !== 'undefined') {
        import('https://cdn.jsdelivr.net/npm/@capacitor/filesystem@5.0.0/dist/esm/index.js').then(module => {
            window.Capacitor.Plugins.Filesystem = module.Filesystem;
            // ...
        });
        import('https://cdn.jsdelivr.net/npm/@capacitor/share@5.0.0/dist/esm/index.js').then(module => {
            window.Capacitor.Plugins.Share = module.Share;
        });
    }
</script>
<script src="backup-android.js"></script>
```

### 3. manager.html Änderungen

**Zeilen modifiziert**: 409-429

**Identisch zu index.html**: Capacitor Plugins eingebunden, backup-android.js statt backup.js.

## Technische Details

### Capacitor Filesystem API

**Directory.Data**:
- Pfad: `/data/data/com.fosbar.app/files/`
- Zugriff: Nur die App (privat)
- Berechtigungen: Keine nötig
- Persistenz: Bis App deinstalliert wird
- Android Backup: Automatisch in System-Backups enthalten

**Methoden**:
```javascript
// Verzeichnis erstellen
await Capacitor.Plugins.Filesystem.mkdir({
    path: 'Backup',
    directory: Directory.Data,
    recursive: true
});

// Datei schreiben
await Capacitor.Plugins.Filesystem.writeFile({
    path: 'Backup/db_produkte.json',
    data: jsonString,
    directory: Directory.Data,
    encoding: Encoding.UTF8
});

// Datei lesen
const result = await Capacitor.Plugins.Filesystem.readFile({
    path: 'Backup/db_produkte.json',
    directory: Directory.Data,
    encoding: Encoding.UTF8
});
```

### Auto-Backup Workflow

**1. App-Start**:
```javascript
AutoBackup.init()
  → setupBackupDirectory()  // Erstellt /Backup/ automatisch
  → performBackup()          // Erstes Backup
  → startAutoBackup()        // Intervall starten (60s)
```

**2. Backup-Intervall**:
- Alle 60 Sekunden
- Läuft im Hintergrund
- Schreibt 6 JSON-Dateien (5 Datenbanken + Metadaten)

**3. Restore**:
```javascript
window.restoreBackup()
  → readFile() für jede Datenbank
  → localStorage.setItem() für alle Daten
  → window.location.reload()
```

**4. Export mit Share (Android-native)**:
```javascript
exportDatabaseToShare('Produkte')
  → writeFile() zu Cache
  → getUri() für Datei
  → Share.share() mit URI
  → Android Share-Dialog öffnet sich
```

## Vergleich: Web vs. Android

| Feature | Web (backup.js) | Android (backup-android.js) |
|---------|----------------|----------------------------|
| **Ordner-Auswahl** | User wählt (`showDirectoryPicker`) | Automatisch (`/Backup/`) |
| **Berechtigungen** | Browser-Dialog | Keine nötig |
| **API** | File System Access API | Capacitor Filesystem |
| **Schreiben** | `createWritable()` → `write()` | `writeFile()` |
| **Lesen** | `getFile()` → `text()` | `readFile()` |
| **Export** | Browser-Download (Blob) | Android Share-Dialog |
| **Speicherort** | User-definiert | App-intern |
| **Setup** | Banner + User-Klick | Automatisch |

## Backwards Compatibility

**Web-Version (backup.js)** bleibt im Root-Verzeichnis und funktioniert weiterhin für Browser-Nutzung.

**Android-Version (backup-android.js)** wird nur in www/ verwendet und nur in der APK aktiviert.

## Testing

### Manuelle Tests (nach APK-Build):

**1. Auto-Backup testen**:
```bash
# In Browser-Console oder via adb logcat
# Nach App-Start prüfen:
→ "🔄 Initialisiere Auto-Backup System (Android)..."
→ "✅ Backup-Verzeichnis erstellt: Backup"
→ "💾 Führe Backup durch (Android)..."
→ "✅ Backup erfolgreich: 5 Datenbanken gesichert"
→ "⏰ Auto-Backup gestartet (alle 60 Sekunden)"
```

**2. Backup-Dateien prüfen**:
```bash
# Via Android Studio Device File Explorer:
# /data/data/com.fosbar.app/files/Backup/
#   ├── db_produkte.json
#   ├── db_gutschriften.json
#   ├── db_schuldbuch.json
#   ├── db_inventar.json
#   ├── db_treuekarten.json
#   └── _backup_info.json
```

**3. Restore testen**:
```javascript
// In Browser-Console:
restoreBackup();
// Erwartung: "📥 Stelle Daten aus Backup wieder her (Android)..."
// Dann: "✅ 5 Datenbank(en) wiederhergestellt"
// App lädt neu
```

**4. Export mit Share testen**:
```javascript
// In Browser-Console:
exportProdukte();
// Erwartung: Android Share-Dialog öffnet sich
// Datenbank kann via E-Mail/Drive/etc. geteilt werden
```

## Build-Schritte

Nach Phase 2 müssen Sie folgende Schritte durchführen:

```bash
# 1. Dependencies installieren (falls noch nicht geschehen)
npm install

# 2. Android-Plattform hinzufügen (falls noch nicht geschehen)
npx cap add android

# 3. Web-Assets synchronisieren (WICHTIG nach Änderungen!)
npx cap sync

# 4. Android Studio öffnen
npx cap open android

# 5. In Android Studio: Build > Build APK
```

**Wichtig**: Nach jeder Änderung in www/ muss `npx cap sync` ausgeführt werden!

## Fehlerbehebung

### Problem: "Capacitor.Plugins.Filesystem is not defined"

**Ursache**: Capacitor-Plugins wurden nicht korrekt geladen.

**Lösung**:
1. Prüfe ob `npx cap sync` ausgeführt wurde
2. Prüfe in Android Studio ob Gradle Sync erfolgreich war
3. In capacitor.config.json prüfen ob webDir korrekt ist

### Problem: "Backup fehlgeschlagen: mkdir error"

**Ursache**: Verzeichnis konnte nicht erstellt werden.

**Lösung**:
1. Prüfe App-Berechtigungen in Android-Einstellungen
2. Prüfe ob genug Speicherplatz vorhanden ist
3. Deinstalliere App und installiere neu (bereinigt App-Daten)

### Problem: "Auto-Backup startet nicht"

**Ursache**: Backup-Initialisierung schlug fehl.

**Lösung**:
1. Prüfe Browser-Console / adb logcat für Fehlermeldungen
2. Stelle sicher dass Capacitor.Plugins verfügbar ist
3. Rufe `window.manualBackup()` manuell auf

## Nächste Schritte (Phase 3)

- Android Back-Button Handling
- Status Bar Styling
- Splash Screen
- Native UI-Anpassungen

## Code-Statistiken

| Datei | Zeilen | Änderungen |
|-------|--------|------------|
| **backup-android.js** | 645 | NEU (basierend auf backup.js) |
| **www/index.html** | +18 | Capacitor Plugins eingebunden |
| **www/manager.html** | +18 | Capacitor Plugins eingebunden |
| **Gesamt** | 681 | +36 neue Zeilen, 1 neue Datei |

## Unterschiede zu backup.js

**Entfernte Zeilen**: ~120 (Browser-spezifischer Code)
**Hinzugefügte Zeilen**: ~90 (Capacitor-Code + Android Share)
**Geänderte Zeilen**: ~60 (API-Aufrufe angepasst)

**Netto**: backup-android.js ist kürzer und einfacher als backup.js, da keine Browser-Kompatibilitätsprüfungen und User-Dialoge nötig sind.
