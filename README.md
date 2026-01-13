# FOS Bar - Kassensystem

Ein vollständiges Point-of-Sale (POS) System für eine Schulbar, entwickelt als client-seitige Webanwendung mit Vanilla JavaScript.

## Features

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

## Installation

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

- [CLAUDE.md](CLAUDE.md) - Technische Architektur und Entwickler-Guide
- [EXPORT_IMPORT_ANLEITUNG.md](EXPORT_IMPORT_ANLEITUNG.md) - Export/Import Funktionen
- [FEHLERBEHEBUNG.md](FEHLERBEHEBUNG.md) - Bekannte Probleme und Lösungen
- [CACHE_LEEREN_ANLEITUNG.html](CACHE_LEEREN_ANLEITUNG.html) - Browser-Cache leeren

## Lizenz

Siehe [LICENSE](LICENSE) Datei für Details.

## Entwickelt mit Claude Code

Dieses Projekt wurde mit Unterstützung von Claude Code entwickelt.
