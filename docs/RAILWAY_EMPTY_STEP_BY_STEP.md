# Railway Empty Project - Schritt für Schritt

## 🎯 Übersicht

Deploye deinen Bot zu Railway ohne GitHub Repository.

## 📋 Schritt 1: Empty Project erstellen

1. **Gehe zu Railway Dashboard:**
   - https://railway.app/dashboard
   - Oder: Railway Dashboard öffnen

2. **Erstelle Projekt:**
   - Klicke auf "New Project"
   - Wähle **"Empty Project"**
   - Warte bis Projekt erstellt ist

3. **Projekt ist bereit:**
   - Du siehst ein leeres Projekt
   - Keine Services noch

## 🔐 Schritt 2: Railway Login

**Im Terminal:**

```bash
railway login
```

- Öffnet Browser
- Autorisiere Railway
- Terminal zeigt "Logged in as ..."

## 🔗 Schritt 3: Projekt verbinden

**Im Projekt-Verzeichnis:**

```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram
railway init
```

- Railway fragt: "Select project"
- Wähle dein "Empty Project" aus
- Railway verbindet lokales Projekt mit Railway

## 📤 Schritt 4: Code deployen

```bash
railway up
```

- Railway lädt Code hoch
- Baut Projekt (`pnpm install && pnpm build`)
- Startet Server
- Gibt URL: `https://your-app.railway.app`

## ⚙️ Schritt 5: ENV-Variablen setzen

**Im Railway Dashboard:**

1. Gehe zu deinem Projekt
2. Klicke auf "Variables" Tab
3. Füge alle ENV-Variablen hinzu:

```bash
TELEGRAM_BOT_TOKEN=dein_token
OPENAI_API_KEY=dein_key
ALLOWED_CHAT_IDS=-5025798709
ALLOWED_USER_IDS=6377811171
OUTBOUND_MODE=sheets
```

**Für Google Sheets (falls verwendet):**
```bash
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_WORKSHEET_NAME=Transaktionen
GOOGLE_SERVICE_ACCOUNT_KEY=...
```

4. **Redeploy** (Railway → Deployments → Redeploy)

## 🔗 Schritt 6: Webhook setzen

**Nach Deployment (URL von Railway):**

```bash
pnpm setup-webhook https://your-app.railway.app/webhook
```

## ✅ Fertig!

Bot läuft jetzt 24/7 in der Cloud!

## 🚀 Schnellstart (All-in-One)

```bash
# 1. Login
railway login

# 2. Verbinden
railway init

# 3. Deployen
railway up

# 4. ENV-Variablen im Dashboard setzen
# 5. Webhook setzen
```

## 🐛 Troubleshooting

### "No projects found"
- Prüfe ob Empty Project in Dashboard erstellt ist
- Prüfe ob eingeloggt: `railway whoami`

### "Build failed"
- Prüfe Railway Logs
- Prüfe ob `pnpm build` lokal funktioniert

### "Bot antwortet nicht"
- Prüfe ENV-Variablen (alle gesetzt?)
- Prüfe Webhook: `pnpm check-webhook`
- Prüfe Railway Logs

### Deployment-URL ändert sich
- Setze Webhook neu mit neuer URL

## 💡 Tipps

1. **Logs:** Immer im Railway Dashboard prüfen
2. **ENV:** Setze alle Variablen vor dem Redeploy
3. **Updates:** `railway up` für neue Deployments
4. **Monitoring:** Railway zeigt CPU, Memory, Requests

