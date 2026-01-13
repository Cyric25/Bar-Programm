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

## Gesicherte Dateien

Im Backup-Ordner werden folgende Dateien erstellt:

```
FOS-Bar-Backup/
├── backup_products.json              # Produktkatalog
├── backup_categories.json            # Kategorien
├── backup_sales.json                 # Verkaufsdaten
├── backup_persons.json               # Kundenguthaben
├── backup_debtors_index.json         # Schuldner-Index
├── backup_debtor_{id}.json           # Einzelne Schuldner
├── backup_loyalty_card_types.json    # Treuekarten-Typen
├── backup_inventory.json             # Inventar
└── backup_metadata.json              # Backup-Info
```

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
