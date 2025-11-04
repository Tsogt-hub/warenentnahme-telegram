# Railway Deployment - Schritt für Schritt

## 🚀 Schnellstart

### 1. Railway CLI installieren
```bash
npm i -g @railway/cli
```

### 2. Login
```bash
railway login
```

### 3. Projekt erstellen
```bash
railway init
```

### 4. ENV-Variablen setzen
```bash
railway variables set TELEGRAM_BOT_TOKEN=your_token
railway variables set OPENAI_API_KEY=your_key
railway variables set ALLOWED_CHAT_IDS=-5025798709
railway variables set ALLOWED_USER_IDS=6377811171
railway variables set OUTBOUND_MODE=sheets
# ... weitere Variablen
```

### 5. Deployen
```bash
railway up
```

### 6. URL kopieren
```bash
railway domain
# Kopiere die URL (z.B. https://your-app.railway.app)
```

### 7. Webhook setzen
```bash
pnpm setup-webhook https://your-app.railway.app/webhook
```

## ✅ Fertig!

Der Bot läuft jetzt 24/7 in der Cloud!

## 📊 Monitoring

```bash
# Logs ansehen
railway logs

# Status prüfen
railway status
```

## 🔄 Updates deployen

```bash
# Code pushen
git push

# Railway deployt automatisch
# Oder manuell:
railway up
```

