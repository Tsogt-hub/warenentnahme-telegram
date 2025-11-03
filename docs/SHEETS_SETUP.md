# Google Sheets Setup-Anleitung

Vollständige Anleitung zur Integration von Google Sheets als Zielsystem für Lagerbewegungen.

## Voraussetzungen

- Google-Konto
- Zugriff auf [Google Cloud Console](https://console.cloud.google.com/)
- Ein Google Spreadsheet (neu oder existierend)

## Schritt 1: Google Cloud Project erstellen

1. Öffne [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Project (oder wähle ein existierendes)
3. Notiere dir die **Project-ID**

## Schritt 2: Google Sheets API aktivieren

1. Gehe zu **APIs & Services** > **Library**
2. Suche nach "Google Sheets API"
3. Klicke auf **Enable** (Aktivieren)

## Schritt 3: Service Account erstellen

1. Gehe zu **APIs & Services** > **Credentials**
2. Klicke auf **Create Credentials** > **Service Account**
3. Fülle aus:
   - **Service account name**: `warenentnahme-sheets` (oder beliebig)
   - **Service account ID**: wird automatisch generiert
   - **Description**: `Service Account für Warenentnahme-Telegram-Bot`
4. Klicke auf **Create and Continue**
5. **Skip** die Role-Zuweisung (nicht nötig)
6. Klicke auf **Done**

## Schritt 4: Service Account Key erstellen

1. Klicke auf den erstellten Service Account
2. Gehe zum Tab **Keys**
3. Klicke auf **Add Key** > **Create new key**
4. Wähle **JSON** als Format
5. Klicke auf **Create**
6. Die JSON-Datei wird automatisch heruntergeladen

**⚠️ WICHTIG:** Bewahre diese Datei sicher auf! Sie enthält Zugangsdaten.

## Schritt 5: Service Account E-Mail notieren

1. Im Service Account Detail findest du die **E-Mail-Adresse**
   - Format: `warenentnahme-sheets@<project-id>.iam.gserviceaccount.com`
2. Kopiere diese E-Mail-Adresse

## Schritt 6: Google Spreadsheet vorbereiten

1. Erstelle ein neues Google Spreadsheet oder öffne ein existierendes
2. **Teile das Spreadsheet mit der Service Account E-Mail**:
   - Klicke auf **Share** (Teilen)
   - Füge die Service Account E-Mail hinzu
   - Setze Berechtigung auf **Editor** (Bearbeiter)
   - **Entferne** "Notify people" Checkbox
   - Klicke auf **Share**

3. **Kopiere die Spreadsheet-ID** aus der URL:
   - URL Format: `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
   - Die `<SPREADSHEET_ID>` ist die ID, die du brauchst

## Schritt 7: Service Account Key konfigurieren

Du hast drei Optionen für die Service Account Key-Konfiguration:

### Option 1: Base64 encoded (empfohlen für Production)

```bash
# JSON-Datei zu Base64 konvertieren
cat service-account-key.json | base64
# Kopiere den gesamten Output
```

### Option 2: Direkter JSON-String (für lokale Entwicklung)

```bash
# JSON-Datei komplett kopieren
cat service-account-key.json
```

### Option 3: Dateipfad (für lokale Entwicklung)

```bash
# Absoluter oder relativer Pfad zur JSON-Datei
/path/to/service-account-key.json
```

## Schritt 8: ENV-Variablen setzen

Füge folgende Variablen zu deiner `.env` hinzu:

```bash
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_SHEETS_WORKSHEET_NAME=Transaktionen
GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME=Lagerbestand
GOOGLE_SHEETS_ALERT_THRESHOLD=10
GOOGLE_SERVICE_ACCOUNT_KEY=<Base64-encoded-oder-JSON-String-oder-Pfad>
```

**Beispiele:**

```bash
# Option 1: Base64
GOOGLE_SERVICE_ACCOUNT_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6Ij...

# Option 2: JSON-String (mit Escape-Zeichen)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Option 3: Dateipfad
GOOGLE_SERVICE_ACCOUNT_KEY=./service-account-key.json
```

## Schritt 9: Testen

1. Starte den Server:
   ```bash
   pnpm dev
   ```

2. Sende eine Test-Nachricht an deinen Bot:
   ```
   nimm 3x M8-Schrauben aus Regal A3
   ```

3. Prüfe dein Google Spreadsheet:
   - Eine neue Zeile sollte erscheinen
   - Header-Zeile wird automatisch erstellt beim ersten Mal

## Troubleshooting

### "Sheets-Client nicht initialisiert"
- Prüfe, ob alle ENV-Variablen gesetzt sind
- Prüfe Logs für detaillierte Fehlermeldungen

### "Permission denied"
- Stelle sicher, dass das Spreadsheet mit der Service Account E-Mail geteilt wurde
- Prüfe, dass die Berechtigung auf **Editor** gesetzt ist

### "Invalid credentials"
- Prüfe Service Account Key Format
- Bei Base64: Stelle sicher, dass komplett dekodiert wird
- Bei JSON-String: Prüfe auf korrekte Escape-Zeichen

### "Spreadsheet not found"
- Prüfe `GOOGLE_SHEETS_SPREADSHEET_ID`
- Stelle sicher, dass die ID aus der URL korrekt kopiert wurde

## Worksheets-Struktur

Das System verwendet **zwei separate Worksheets**:

### 1. Transaktionen-Worksheet (Default: "Transaktionen")
Erfasst alle Lagerbewegungen:

1. Timestamp
2. Aktion
3. Artikelname
4. SKU
5. Menge
6. Einheit
7. Lagerort
8. Projekt-ID
9. Projekt-Label
10. Grund
11. Person
12. Notizen
13. Confidence
14. Klärung nötig
15. Klärungsfrage
16. Telegram User-ID
17. Telegram Username
18. Request-ID
19. Duplikat
20. Autorisiert

### 2. Lagerbestand-Worksheet (Default: "Lagerbestand")
Verwaltet den aktuellen Lagerbestand:

**Spalten:**
1. SKU
2. Artikelname
3. Bestand (wird automatisch aktualisiert)
4. Einheit
5. Lagerort
6. Meldebestand (optional, für Alerts)

**Automatische Funktionen:**
- Bei **Entnahme** (withdraw): Bestand wird reduziert
- Bei **Rückgabe** (return): Bestand wird erhöht
- Bei **Inventur** (adjust): Bestand wird auf angegebene Menge gesetzt
- **Meldebestand-Prüfung**: Wenn Bestand unter Schwellwert fällt, wird Alert gesendet

## Sicherheit

- **Nie** committe die Service Account Key-Datei in Git
- Verwende `.env` für lokale Entwicklung
- Für Production: Verwende Secrets-Management (z.B. Google Secret Manager)
- Base64-Encoding bietet keine zusätzliche Sicherheit, nur bessere Handhabung in ENV-Variablen

