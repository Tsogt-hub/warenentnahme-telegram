# Setup-Checklist

## ✅ Bereits erledigt

- [x] Spreadsheet-ID konfiguriert: `1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc`
- [x] Service Account Key-Datei kopiert: `service-account-key.json`
- [x] ENV-Datei erstellt mit Spreadsheet-Config

## 🔲 Noch zu erledigen

### 1. Spreadsheet mit Service Account teilen ⚠️ WICHTIG

**Service Account E-Mail:** `sheets-connector@warenlager.iam.gserviceaccount.com`

**Aktion:**
1. Öffne: https://docs.google.com/spreadsheets/d/1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc/edit
2. Klicke auf **"Teilen"** (oben rechts)
3. Füge diese E-Mail hinzu: `sheets-connector@warenlager.iam.gserviceaccount.com`
4. Setze Berechtigung auf **"Bearbeiter"** (Editor)
5. Entferne Checkbox "Personen benachrichtigen"
6. Klicke auf **"Teilen"**

**Ohne diesen Schritt funktioniert die Integration nicht!**

### 2. ENV-Variablen vervollständigen

Öffne `.env` und trage ein:

```bash
# Diese Werte noch eintragen:
TELEGRAM_BOT_TOKEN=<dein_telegram_bot_token>
OPENAI_API_KEY=<dein_openai_api_key>
```

### 3. Worksheets prüfen

Das System erwartet zwei Worksheets:

1. **"Transaktionen"** - für alle Lagerbewegungen
2. **"Lagerbestand"** - für aktuellen Bestand

**Falls andere Namen verwendet werden:**
- Passe `GOOGLE_SHEETS_WORKSHEET_NAME` und `GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME` in `.env` an

**Falls die Worksheets noch nicht existieren:**
- Werden automatisch beim ersten Schreibvorgang erstellt

### 4. Testen

```bash
# 1. Dependencies installieren (falls noch nicht geschehen)
pnpm install

# 2. Server starten
pnpm dev

# 3. Telegram-Bot konfigurieren (siehe QUICKSTART.md)
# 4. Test-Nachricht senden
```

## 📋 Service Account Details

- **Project ID:** `warenlager`
- **Client Email:** `sheets-connector@warenlager.iam.gserviceaccount.com`
- **Key File:** `service-account-key.json` (im Projekt-Root)

## ⚠️ Sicherheitshinweis

- Die `service-account-key.json` ist in `.gitignore` (wird nicht committed)
- Niemals die Datei in Git committen!
- Für Production: Verwende Secrets-Management

