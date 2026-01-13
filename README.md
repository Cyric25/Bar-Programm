# FOS Bar - Kassensystem

Ein vollständiges Point-of-Sale (POS) System für eine Schulbar, verfügbar als **Web-Anwendung** und **Android-App**.

- 🌐 **Web-Version**: Browser-basiert (Chrome, Edge, Firefox)
- 📱 **Android-Version**: Native APK mit Capacitor (siehe [android-conversion Branch](https://github.com/Cyric25/Bar-Programm/tree/android-conversion))

## Features

### Automatisches Backup-System
- **Automatische Datensicherung** alle 60 Sekunden
- **Lokale Speicherung** in einem Ordner Ihrer Wahl
- **Wiederherstellung** bei Gerätewechsel oder Datenverlust
- **File System Access API** für moderne Browser (Chrome, Edge)
- Siehe [BACKUP_SYSTEM.md](BACKUP_SYSTEM.md) für Details

### Verkaufssystem
- **Schnelle Produktauswahl** mit Kategorisierung (Getränke, Alkohol, Snacks)
- **Mehrere Zahlungsmethoden**:
  - Barzahlung
  - Guthabenkonto
  - Treuekarten (Stempelkarten)
  - Auf Rechnung (Schuldbuch)
- **Tagesübersicht** mit Export-Funktion

### Gutschriften-Verwaltung
- **Kundenguthaben** mit Auflade- und Abbuchungsfunktion
- **Treuekartensystem**:
  - "Kaufe N, erhalte 1 gratis" Karten
  - "Zahle N, erhalte M" Karten
  - Flexible Bindung (einzelnes Produkt, mehrere Produkte, oder Kategorie)
  - Automatisches Löschen nach Einlösung
- **Alphabet-Filter** für schnelle Personensuche

### Schuldbuch
- **Schuldenverwaltung** für Kunden, die auf Rechnung kaufen
- **Transaktionsverlauf** mit Zeitstempeln
- **Teilzahlungen** möglich
- **Separate JSON-Dateien** pro Schuldner für bessere Performance
- **Export/Import** Funktionen

### Manager-Bereich
- **Produktverwaltung**: Erstellen, bearbeiten, löschen von Produkten
- **Kategorienverwaltung**: Eigene Kategorien definieren
- **Treuekartenkonfiguration**: Flexible Kartentypen erstellen
- **Bilanz**: Tagesübersicht mit Produktaufschlüsselung
- **Statistik**: Verkaufsanalysen mit Top-Verkäufer-Listen
- **Inventar**: Bestandsverwaltung mit Verbrauchsprognosen

## Android-App (NEU) 📱

Die FOS Bar ist jetzt auch als **native Android-App** verfügbar!

### Android-spezifische Features:
- ✅ **Automatisches Backup** ins App-Verzeichnis (alle 60 Sek.)
- ✅ **Natives Back-Button Handling** (Tab-Navigation, Exit-Bestätigung)
- ✅ **Gebrandmarkte Status Bar** (blau, passend zum Design)
- ✅ **Android Share-Dialog** für Datenbank-Exports
- ✅ **Offline-First** (keine Internet-Verbindung nötig)
- ✅ **App-Lifecycle Management** (Backup vor Home-Button)
- ✅ **100% Feature-Parity** mit Web-Version

### Android-APK bauen:

```bash
# 1. Dependencies installieren
npm install

# 2. Android-Plattform hinzufügen
npx cap add android

# 3. Assets synchronisieren
npx cap sync

# 4. Android Studio öffnen
npx cap open android

# 5. APK bauen
Build > Build APK(s)
```

**Detaillierte Anleitung**: Siehe [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)

### Android-Dokumentation:
- 📖 [ANDROID_SETUP.md](ANDROID_SETUP.md) - Setup-Anleitung
- 📖 [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) - APK-Build-Schritte
- 📖 [PHASE2_CHANGES.md](PHASE2_CHANGES.md) - Backup-System Details
- 📖 [PHASE3_CHANGES.md](PHASE3_CHANGES.md) - UI/UX-Features Details

**Branch**: [android-conversion](https://github.com/Cyric25/Bar-Programm/tree/android-conversion)

---

## Installation (Web-Version)

Keine Installation erforderlich! Einfach die Dateien auf einen Webserver kopieren oder lokal öffnen:

1. Repository klonen oder herunterladen
2. `index.html` im Browser öffnen
3. Für Verwaltung: `manager.html` öffnen

## Verwendung

### Erste Schritte
1. Öffnen Sie `manager.html` im Browser
2. Fügen Sie Kategorien hinzu (falls noch nicht vorhanden)
3. Erstellen Sie Produkte in der Verwaltung
4. Optional: Erstellen Sie Treuekarten-Typen
5. Wechseln Sie zu `index.html` für Verkäufe

### Verkauf tätigen
- Klicken Sie auf ein Produkt im Verkauf-Tab
- Verkauf wird sofort erfasst und in der Tagesübersicht angezeigt

### Mit Guthaben verkaufen
1. Wechseln Sie zum Gutschriften-Tab
2. Wählen Sie eine Person aus
3. Wählen Sie "Guthaben" oder "Stempel" als Zahlungsart
4. Klicken Sie auf ein Produkt

### Daten sichern
Verwenden Sie die Export-Funktionen in jedem Tab:
- **Verkauf**: Exportiert alle Verkäufe
- **Gutschriften**: Exportiert alle Personen mit Guthaben
- **Schuldbuch**: Exportiert alle Schuldner
- **Manager**: Exportiert Produkte

## Technische Details

- **Keine Abhängigkeiten**: Reine HTML5, CSS3, JavaScript (ES6+)
- **Datenspeicherung**: Browser localStorage
- **Offline-fähig**: Funktioniert komplett ohne Server
- **Export/Import**: JSON-basierte Datensicherung
- **Browser-Kompatibilität**: Moderne Browser (Chrome, Firefox, Edge)

## Datenstruktur

Alle Daten werden im localStorage gespeichert:
- `fos_bar_products` - Produktkatalog
- `fos_bar_categories` - Kategorien
- `fos_bar_sales` - Verkaufsdaten
- `fos_bar_persons` - Kundenguthaben
- `fos_bar_debtors_*` - Schuldbuch (separiert)
- `fos_bar_loyalty_card_types` - Treuekarten-Definitionen
- `fos_bar_inventory` - Inventardaten

Siehe [CLAUDE.md](CLAUDE.md) für detaillierte Architektur-Dokumentation.

## Dokumentation

### Web-Version
- [CLAUDE.md](CLAUDE.md) - Technische Architektur und Entwickler-Guide
- [BACKUP_SYSTEM.md](BACKUP_SYSTEM.md) - Automatisches Backup-System (Web)
- [EXPORT_IMPORT_ANLEITUNG.md](EXPORT_IMPORT_ANLEITUNG.md) - Export/Import Funktionen
- [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md) - Bekannte Probleme und Lösungen
- [CACHE_LEEREN_ANLEITUNG.html](CACHE_LEEREN_ANLEITUNG.html) - Browser-Cache leeren

### Android-Version
- [ANDROID_SETUP.md](ANDROID_SETUP.md) - Android Setup-Anleitung
- [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) - APK Build-Anleitung
- [PHASE2_CHANGES.md](PHASE2_CHANGES.md) - Android Backup-System
- [PHASE3_CHANGES.md](PHASE3_CHANGES.md) - Android UI/UX-Features

## Lizenz

Siehe [LICENSE](LICENSE) Datei für Details.

## Entwickelt mit Claude Code

Dieses Projekt wurde mit Unterstützung von Claude Code entwickelt.
