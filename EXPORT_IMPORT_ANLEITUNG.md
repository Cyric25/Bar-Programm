# Export/Import Funktionen - Anleitung

## Übersicht

Die FOS Bar Anwendung bietet umfassende Export/Import-Funktionen für alle wichtigen Datentypen.

## Verfügbare Funktionen

### 1. Verkaufsdaten (Bilanz-Tab)
**Exportieren:**
- Button: "Daten exportieren (JSON)"
- Dateiname: `fos-bar-verkäufe-YYYY-MM-DD.json`
- Inhalt: Alle Verkaufsdaten (Array von Verkäufen)

**Importieren:**
- Button: "Daten importieren"
- Format: JSON-Array mit Verkaufsdaten
- Bestätigung erforderlich
- ⚠️ Überschreibt bestehende Daten

### 2. Gutschriften (Gutschriften-Tab)
**Exportieren:**
- Button: "Gutschriften exportieren (JSON)"
- Dateiname: `fos-bar-gutschriften-YYYY-MM-DD.json`
- Inhalt:
  ```json
  {
    "persons": [...],
    "exportDate": "2024-01-12T10:30:00.000Z"
  }
  ```

**Importieren:**
- Button: "Gutschriften importieren"
- Format: JSON-Objekt mit `persons` Array
- Unterstützt auch direktes Array-Format
- Bestätigung erforderlich
- ⚠️ Überschreibt bestehende Daten

### 3. Schuldbuch (Schuldbuch-Tab)
**Exportieren:**
- Button: "Schuldbuch exportieren (JSON)"
- Dateiname: `fos-bar-schuldbuch-YYYY-MM-DD.json`
- Inhalt:
  ```json
  {
    "debtors": [...],
    "exportDate": "2024-01-12T10:30:00.000Z"
  }
  ```

**Importieren:**
- Button: "Schuldbuch importieren"
- Format: JSON-Objekt mit `debtors` Array
- Unterstützt auch direktes Array-Format
- Bestätigung erforderlich
- ⚠️ Überschreibt bestehende Daten

### 4. Produkte (Manager > Verwaltung-Tab)
**Exportieren:**
- Button: "JSON exportieren"
- Dateiname: `fos-bar-produkte-YYYY-MM-DD.json`
- Inhalt: Array mit allen Produkten

**Importieren:**
- Button: "JSON importieren"
- Format: JSON-Array mit Produktdaten
- Bestätigung erforderlich
- ⚠️ Überschreibt bestehende Daten

## Datenformat-Beispiele

### Verkaufsdaten
```json
[
  {
    "id": "1705058400000_product1",
    "name": "Cola",
    "price": 2.50,
    "category": "drinks",
    "timestamp": "2024-01-12T10:00:00.000Z"
  }
]
```

### Gutschriften
```json
{
  "persons": [
    {
      "id": "person_1705058400000",
      "name": "Max Mustermann",
      "balance": 10.00,
      "transactions": [],
      "loyaltyCards": []
    }
  ],
  "exportDate": "2024-01-12T10:30:00.000Z"
}
```

### Schuldbuch
```json
{
  "debtors": [
    {
      "id": "debtor_1705058400000",
      "name": "Anna Schmidt",
      "debt": 15.50,
      "transactions": [],
      "isPaid": false
    }
  ],
  "exportDate": "2024-01-12T10:30:00.000Z"
}
```

### Produkte
```json
[
  {
    "id": "product_1705058400000",
    "name": "Cola",
    "price": 2.50,
    "category": "drinks",
    "sortOrder": 0
  }
]
```

## Sicherheitshinweise

⚠️ **WICHTIG:**
- Beim Import werden ALLE bestehenden Daten des jeweiligen Typs überschrieben
- Exportieren Sie regelmäßig Backups Ihrer Daten
- Überprüfen Sie importierte Dateien vor dem Import auf Korrektheit
- Es wird immer eine Bestätigungsdialog angezeigt vor dem Import

## Fehlerbehandlung

Alle Import-Funktionen enthalten Fehlerbehandlung:
- JSON-Syntax-Fehler werden abgefangen
- Ungültiges Datenformat wird erkannt
- Fehler werden als Toast-Nachricht angezeigt
- Bei Fehler bleiben bestehende Daten unverändert

## Tipps

1. **Regelmäßige Backups**: Exportieren Sie Ihre Daten regelmäßig
2. **Dateinamen**: Die automatischen Dateinamen enthalten das aktuelle Datum
3. **Datenmigration**: Nutzen Sie Export/Import für Datenmigration zwischen Systemen
4. **Archivierung**: Alte Daten können exportiert und separat archiviert werden

## Technische Details

- Alle Daten werden im JSON-Format gespeichert
- localStorage wird als primärer Speicher verwendet
- File-Reader API für das Lesen importierter Dateien
- Blob API für das Erstellen von Download-Dateien
- Automatische Bestätigungsdialoge über die `confirmAction()` Funktion
