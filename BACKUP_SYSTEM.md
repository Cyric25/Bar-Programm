# Automatisches Backup-System

## Übersicht

Das FOS Bar System verfügt über ein automatisches Backup-System, das Ihre Daten regelmäßig in einem von Ihnen gewählten Ordner sichert. Dies schützt Ihre Daten vor Verlust durch Browser-Cache-Löschung, Gerätewechsel oder technische Probleme.

## Features

✅ **Automatische Backups**: Alle 60 Sekunden werden Ihre Daten gesichert
✅ **Lokale Speicherung**: Backups werden in einem Ordner Ihrer Wahl gespeichert
✅ **Alle Datentypen**: Produkte, Verkäufe, Personen, Schuldbuch, Treuekarten, Inventar
✅ **Wiederherstellung**: Daten können jederzeit wiederhergestellt werden
✅ **Metadaten**: Jedes Backup enthält Zeitstempel und Versionsinformationen

## Erste Einrichtung

### Schritt 1: Backup-Ordner auswählen

Beim ersten Start von `index.html` oder `manager.html` erscheint ein Banner:

```
💾 Automatisches Backup aktivieren?
[Backup-Ordner auswählen] [Später]
```

Klicken Sie auf **"Backup-Ordner auswählen"**.

### Schritt 2: Ordner wählen

1. Ein Datei-Dialog öffnet sich
2. Wählen Sie einen Ordner aus (z.B. `Dokumente/FOS-Bar-Backup`)
3. Bestätigen Sie die Auswahl

### Schritt 3: Fertig!

Das System startet automatisch:
- ✅ Erstes Backup wird sofort erstellt
- ✅ Automatische Backups alle 60 Sekunden
- ✅ Status wird unten rechts angezeigt
- ✅ **Ordner wird gemerkt**: Beim Wechsel zwischen index.html und manager.html wird automatisch derselbe Ordner verwendet

### Wichtig: Ordner-Merkfunktion

Nach der ersten Einrichtung merkt sich das System, dass Sie ein Backup aktiviert haben. Beim nächsten Öffnen:
1. **Kein Banner mehr** - Das Banner erscheint nicht erneut
2. **Automatische Anfrage** - Der Browser fragt direkt nach dem Backup-Ordner
3. **Zwischen Seiten wechseln** - Funktioniert nahtlos zwischen index.html und manager.html
4. **Einmal einrichten** - Danach immer aktiv

**Hinweis:** Der Browser kann File System API Handles nicht persistent speichern. Daher müssen Sie bei jedem Seitenaufruf einmal den Ordner bestätigen (ein Klick im Browser-Dialog).

## Gesicherte Dateien

Im Backup-Ordner werden folgende **konsolidierte Datenbank-Dateien** erstellt:

```
FOS-Bar-Backup/
├── db_produkte.json          # Produktkatalog + Kategorien
├── db_gutschriften.json      # Personen mit Guthaben + Treuekarten
├── db_schuldbuch.json        # Personen mit Schulden (alle Schuldner)
├── db_inventar.json          # Inventar + Verkaufsdaten
├── db_treuekarten.json       # Treuekarten-Typen
└── _backup_info.json         # Backup-Metadaten
```

Jede Datei ist eine eigenständige Datenbank und kann separat importiert/exportiert werden.

## Daten wiederherstellen

### Automatische Wiederherstellung

Wenn Sie das System auf einem neuen Gerät oder nach Browser-Cache-Löschung öffnen:

1. Wählen Sie denselben Backup-Ordner aus
2. Das System erkennt die Backup-Dateien
3. Sie können die Daten wiederherstellen

### Manuelle Wiederherstellung

In der Browser-Konsole (F12):

```javascript
restoreBackup()
```

Oder verwenden Sie die Import-Funktionen in der Anwendung.

## Manuelle Steuerung

### Backup jetzt durchführen

```javascript
manualBackup()
```

### Backup-Ordner neu wählen

```javascript
setupBackup()
```

### Backup deaktivieren

```javascript
disableBackup()
```

Stoppt das automatische Backup und entfernt die Konfiguration. Das Banner erscheint beim nächsten Start wieder.

## Einzelne Datenbanken exportieren/importieren

Sie können jede Datenbank einzeln exportieren und importieren. Dies ist nützlich für:
- Übertragung einzelner Daten zwischen Geräten
- Sicherung spezifischer Bereiche
- Wiederherstellung ohne andere Daten zu überschreiben

### Export (Browser-Konsole F12)

```javascript
// Produktkatalog + Kategorien exportieren
exportProdukte()

// Personen mit Guthaben exportieren
exportGutschriften()

// Schuldbuch exportieren (alle Schuldner)
exportSchuldbuch()

// Inventar + Verkaufsdaten exportieren
exportInventar()

// Treuekarten-Typen exportieren
exportTreuekarten()
```

### Import (Browser-Konsole F12)

```javascript
// Produktkatalog + Kategorien importieren
importProdukte()

// Personen mit Guthaben importieren
importGutschriften()

// Schuldbuch importieren (alle Schuldner)
importSchuldbuch()

// Inventar + Verkaufsdaten importieren
importInventar()

// Treuekarten-Typen importieren
importTreuekarten()
```

Nach dem Import wird die Seite automatisch neu geladen, um die Änderungen anzuzeigen.

### Datenbank-Format

Jede Datenbank-Datei hat folgende Struktur:

```json
{
  "_metadata": {
    "databaseName": "Produkte",
    "exportDate": "2026-01-13T08:00:00.000Z",
    "version": "2.0"
  },
  "fos_bar_products": [...],
  "fos_bar_categories": [...]
}
```

Die Metadaten stellen sicher, dass nur kompatible Datenbanken importiert werden können.

## Browser-Kompatibilität

Das automatische Backup nutzt die **File System Access API** und funktioniert in:

✅ **Chrome** (ab Version 86)
✅ **Edge** (ab Version 86)
✅ **Opera** (ab Version 72)

❌ **Firefox** - Noch nicht unterstützt (nutzen Sie manuelle Export-Funktionen)
❌ **Safari** - Noch nicht unterstützt (nutzen Sie manuelle Export-Funktionen)

### Fallback für nicht unterstützte Browser

In Browsern ohne File System Access API:
- Es erscheint eine Warnung
- Nutzen Sie die manuellen Export-Funktionen in jedem Tab
- Exportieren Sie regelmäßig Ihre Daten

## Sicherheit & Datenschutz

- ✅ **Lokale Speicherung**: Alle Daten bleiben auf Ihrem Computer
- ✅ **Keine Cloud**: Keine Daten werden ins Internet übertragen
- ✅ **Ihre Kontrolle**: Sie wählen den Backup-Ordner
- ✅ **Verschlüsselung**: Nutzen Sie Windows BitLocker oder ähnliche Tools für den Backup-Ordner

## Häufige Fragen

### Wie oft wird gesichert?

Alle 60 Sekunden automatisch, wenn die Seite geöffnet ist.

### Was passiert wenn ich die Seite schließe?

Das Backup pausiert. Beim nächsten Öffnen wird sofort ein Backup erstellt.

### Kann ich mehrere Geräte synchronisieren?

Ja! Legen Sie den Backup-Ordner auf OneDrive, Dropbox oder einem Netzlaufwerk an. Alle Geräte können dann auf dieselben Backups zugreifen.

**WICHTIG**: Öffnen Sie die Anwendung nicht gleichzeitig auf mehreren Geräten, da dies zu Konflikten führen kann.

### Wo sehe ich den Backup-Status?

Unten rechts auf der Seite wird "Letztes Backup: [Zeit]" angezeigt.

### Kann ich den Backup-Ordner ändern?

Ja! In der Browser-Konsole (F12):

```javascript
setupBackup()
```

### Wie viel Speicherplatz brauchen die Backups?

Typischerweise:
- Neue Installation: ~10 KB
- Nach 1 Woche Betrieb: ~100-500 KB
- Nach 1 Monat: ~1-5 MB

Die Dateien werden bei jedem Backup überschrieben, nicht angehängt.

### Was passiert bei einem Fehler?

- Zugriff verweigert → Banner erscheint erneut, Ordner neu wählen
- Ordner gelöscht → Banner erscheint, neuen Ordner wählen
- Keine Berechtigung → Prüfen Sie die Ordner-Berechtigungen

## Empfohlene Backup-Strategie

1. **Automatisches Backup** aktivieren (alle 60 Sek.)
2. **Wöchentlich** zusätzlich manuell exportieren
3. **Monatlich** Backup-Ordner an sicheren Ort kopieren
4. **Bei großen Änderungen** sofort manuell exportieren

## Technische Details

- **API**: File System Access API
- **Intervall**: 60000 ms (60 Sekunden)
- **Format**: JSON (UTF-8)
- **Metadaten**: ISO 8601 Zeitstempel
- **Speicher**: Direkt im Dateisystem

## Fehlerbehebung

### Banner wird nicht angezeigt

- Prüfen Sie die Browser-Konsole (F12)
- Aktualisieren Sie die Seite (Strg + F5)
- Prüfen Sie ob Ihr Browser die File System Access API unterstützt

### Backup schlägt fehl

- Prüfen Sie Ordner-Berechtigungen
- Stellen Sie sicher, dass der Ordner noch existiert
- Wählen Sie einen neuen Ordner mit `setupBackup()`

### Daten wurden nicht wiederhergestellt

- Prüfen Sie ob die Backup-Dateien existieren
- Öffnen Sie die Browser-Konsole für Fehlermeldungen
- Nutzen Sie die manuellen Import-Funktionen als Fallback

## Support

Bei Problemen:
1. Prüfen Sie die Browser-Konsole (F12) für Fehlermeldungen
2. Siehe [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md)
3. Nutzen Sie die manuellen Export-Funktionen als Fallback
