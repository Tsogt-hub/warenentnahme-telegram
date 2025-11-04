# Railway Quickstart - Schritt für Schritt

## 🚀 Schritt 1: GitHub Repository auswählen

**Wähle: "GitHub Repository"**

1. Railway zeigt deine GitHub Repositories
2. Wähle: `warenentnahme-telegram` (oder dein Repo-Name)
3. Klicke auf das Repository

## 📋 Schritt 2: ENV-Variablen setzen

Nach dem Deployment, im Railway Dashboard:

### Gehe zu "Variables" Tab

Setze folgende Variablen:

```bash
TELEGRAM_BOT_TOKEN=dein_bot_token
OPENAI_API_KEY=dein_openai_key
ALLOWED_CHAT_IDS=-5025798709
ALLOWED_USER_IDS=6377811171
OUTBOUND_MODE=sheets
PORT=3000
```

**Für Google Sheets (falls verwendet):**
```bash
GOOGLE_SHEETS_SPREADSHEET_ID=deine_spreadsheet_id
GOOGLE_SHEETS_WORKSHEET_NAME=Transaktionen
GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME=Lagerbestand
GOOGLE_SERVICE_ACCOUNT_KEY=dein_service_account_key
```

## 🔧 Schritt 3: Build Settings (optional)

Railway erkennt automatisch:
- ✅ Node.js Projekt
- ✅ `package.json` vorhanden
- ✅ Start-Command: `pnpm start`

Falls nicht automatisch:
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`

## 🌐 Schritt 4: Domain erhalten

Nach Deployment:
1. Railway gibt automatisch eine URL: `https://your-app.railway.app`
2. Kopiere diese URL

## 🔗 Schritt 5: Webhook setzen

```bash
# Lokal auf deinem Laptop:
pnpm setup-webhook https://your-app.railway.app/webhook
```

## ✅ Fertig!

Der Bot läuft jetzt 24/7 in der Cloud!

## 📊 Monitoring

Im Railway Dashboard:
- **Logs:** Siehst du alle Server-Logs
- **Metrics:** CPU, Memory, Requests
- **Deployments:** Alle Deployments

## 🔄 Updates

Jedes Mal wenn du zu GitHub pushst:
```bash
git push
```

Railway deployt automatisch neu!

## 🐛 Troubleshooting

### Bot antwortet nicht
1. Prüfe Logs im Railway Dashboard
2. Prüfe ENV-Variablen (alle gesetzt?)
3. Prüfe Webhook: `pnpm check-webhook`

### Build fehlschlägt
- Prüfe ob `pnpm build` lokal funktioniert
- Prüfe Railway Logs

## 💡 Tipps

1. **ENV-Variablen:** Setze alle in Railway Dashboard
2. **Logs:** Immer im Railway Dashboard prüfen
3. **Webhook:** Nach jedem Deployment neu setzen (falls URL ändert)

