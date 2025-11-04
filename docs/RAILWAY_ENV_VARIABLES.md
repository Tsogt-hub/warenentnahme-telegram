# Railway ENV-Variablen - Checkliste

## 📋 Alle benötigten Variablen

Kopiere diese in Railway Dashboard → Variables:

### 🔴 Erforderlich

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
OPENAI_API_KEY=sk-...
ALLOWED_CHAT_IDS=-5025798709
ALLOWED_USER_IDS=6377811171
OUTBOUND_MODE=sheets
```

### 🟡 Optional (für Google Sheets)

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_WORKSHEET_NAME=Transaktionen
GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME=Lagerbestand
GOOGLE_SHEETS_ALERT_THRESHOLD=10
GOOGLE_SERVICE_ACCOUNT_KEY=...
```

### 🟢 Optional (Standard-Werte)

```bash
PORT=3000              # Railway setzt automatisch
LOG_LEVEL=info         # Optional
NODE_ENV=production   # Railway setzt automatisch
```

## ✅ Prüfen

Nach dem Setzen aller Variablen:
1. **Redeploy** (Railway → Deployments → Redeploy)
2. **Prüfe Logs** (sollten keine ENV-Fehler zeigen)
3. **Teste Webhook:** `pnpm check-webhook`

## 💡 Tipp

Kopiere alle Variablen aus deiner lokalen `.env` Datei!

