# Aktuelles Google Spreadsheet

## Spreadsheet-Details

**URL:** https://docs.google.com/spreadsheets/d/1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc/edit

**Spreadsheet-ID:** `1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc`

**Aktuelles Worksheet (gid):** `2096233747`

## Nächste Schritte

### 1. Service Account Setup

Falls noch nicht vorhanden, siehe [SHEETS_SETUP.md](SHEETS_SETUP.md) für:
- Google Cloud Project erstellen
- Service Account anlegen
- Service Account Key erstellen
- Spreadsheet mit Service Account E-Mail teilen

### 2. Worksheet-Struktur prüfen

Das System benötigt zwei Worksheets:

1. **"Transaktionen"** (oder anderer Name)
   - Für alle Lagerbewegungen
   - Wird automatisch mit Header erstellt falls nicht vorhanden

2. **"Lagerbestand"** (oder anderer Name)
   - Für aktuellen Bestand
   - Format: SKU | Artikelname | Bestand | Einheit | Lagerort | Meldebestand
   - Wird automatisch mit Header erstellt falls nicht vorhanden

### 3. ENV-Variablen setzen

Nach Service Account Setup, füge zu `.env` hinzu:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc
GOOGLE_SHEETS_WORKSHEET_NAME=Transaktionen  # Oder Name des bestehenden Worksheets
GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME=Lagerbestand  # Oder Name des bestehenden Worksheets
GOOGLE_SERVICE_ACCOUNT_KEY=<Base64-oder-JSON-String-oder-Dateipfad>
```

### 4. Testen

```bash
pnpm dev
# Sende Test-Nachricht an Bot
# Prüfe Spreadsheet
```

## Hinweise

- Falls bereits Daten im Spreadsheet existieren, wird der Header nicht überschrieben
- Die Header-Zeilen werden nur erstellt wenn die Worksheets leer sind
- Service Account E-Mail muss Editor-Rechte haben

