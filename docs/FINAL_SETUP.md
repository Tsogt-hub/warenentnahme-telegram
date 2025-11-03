# Finales Setup - Start-Anleitung

Alle Konfigurationen sind abgeschlossen! 🎉

## ✅ Bereits konfiguriert

- [x] Telegram Bot Token
- [x] Claude API Key
- [x] Google Spreadsheet ID
- [x] Service Account Key
- [x] Service Account mit Spreadsheet geteilt
- [x] Alle ENV-Variablen gesetzt

## 🚀 Server starten

```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram

# Development (mit Watch-Mode)
pnpm dev

# Oder Production Build
pnpm build
pnpm start
```

Server läuft auf: `http://localhost:3000`

## 🔗 Webhook konfigurieren

### Option 1: Lokale Entwicklung mit ngrok

```bash
# Terminal 1: Server starten
pnpm dev

# Terminal 2: ngrok starten
ngrok http 3000

# Terminal 3: Webhook setzen
pnpm setup-webhook https://<deine-ngrok-url>.ngrok.io/webhook
```

### Option 2: Production

```bash
pnpm setup-webhook https://your-domain.com/webhook
```

## 🧪 Testen

1. **Bot testen:**
   - Sende eine Nachricht an deinen Bot
   - Beispiel: `"nimm 3x M8-Schrauben aus Regal A3"`

2. **Health-Check:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Webhook-Info:**
   ```bash
   curl http://localhost:3000/webhook/info
   ```

## 📊 Google Sheets prüfen

Nach einer Test-Nachricht:

1. Öffne das Spreadsheet: https://docs.google.com/spreadsheets/d/1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc/edit
2. Prüfe Worksheet "Transaktionen" - neue Zeile sollte erscheinen
3. Prüfe Worksheet "Lagerbestand" - Bestand sollte aktualisiert werden

## 🔍 Troubleshooting

### Bot antwortet nicht
- Prüfe Webhook: `pnpm setup-webhook` zeigt Status
- Prüfe Server-Logs für Fehler
- Prüfe `ALLOWED_CHAT_IDS` / `ALLOWED_USER_IDS`

### Claude API Fehler
- Prüfe `CLAUDE_API_KEY` in `.env`
- Prüfe API-Key Gültigkeit in Anthropic Console
- Prüfe API-Limits/Credits

### Google Sheets Fehler
- Stelle sicher, dass Spreadsheet mit `sheets-connector@warenlager.iam.gserviceaccount.com` geteilt wurde
- Prüfe Berechtigung (Editor)
- Prüfe Logs für detaillierte Fehlermeldungen

### Server startet nicht
- Prüfe alle ENV-Variablen in `.env`
- Prüfe ob Port 3000 frei ist
- Prüfe Logs: `LOG_LEVEL=debug` für mehr Details

## 📝 Beispiel-Nachrichten zum Testen

- `"nimm 5x M8-Schrauben aus Regal A3"`
- `"entnimm 3 Rollen Kabel Lager: Kabelwand A"`
- `"zurück 2x Makita Akkuschrauber Kiste B2"`
- `"inventur M6 Mutter 250 Stk Lager D1"`
- `"Kanal 30 x5 removed"` (Englisch)
- `"mehrere Kabel entfernt"` (sollte Nachfrage stellen)

## ✨ Features

- ✅ Intelligentes Parsing mit Fuzzy-Matching
- ✅ Confidence-Levels für unsichere Erkennungen
- ✅ Automatische Bestandsverwaltung
- ✅ Meldebestand-Alerts
- ✅ Duplikat-Erkennung
- ✅ Authorization-Guards

Viel Erfolg! 🚀

