# Deployment - Bot dauerhaft laufen lassen

## Aktuelle Situation (Lokal)

**Ja, aktuell muss dein Laptop an sein:**
- ✅ Server läuft lokal auf Port 3000
- ✅ Tunnel (localtunnel/ngrok) macht Server öffentlich erreichbar
- ❌ Wenn Laptop aus ist → Bot funktioniert nicht

## Lösung: Production-Deployment

Für dauerhaften Betrieb ohne Laptop gibt es mehrere Optionen:

### Option 1: Cloud-Server (Empfohlen)

**Vorteile:**
- ✅ Läuft 24/7
- ✅ Kein Laptop nötig
- ✅ Professionell & zuverlässig

**Anbieter:**
- **Railway** (einfach, kostenloser Start)
- **Render** (kostenloser Tier verfügbar)
- **Fly.io** (gut für Node.js)
- **DigitalOcean App Platform**
- **Heroku** (einfach, aber kostenpflichtig)

**Kosten:** Meist $0-10/Monat (je nach Traffic)

### Option 2: VPS (Virtual Private Server)

**Vorteile:**
- ✅ Vollständige Kontrolle
- ✅ Günstig (ab ~$5/Monat)
- ✅ Flexibel

**Anbieter:**
- **DigitalOcean** (Droplets, ab $6/Monat)
- **Hetzner** (sehr günstig, ab €4/Monat)
- **Linode** (ab $5/Monat)
- **AWS EC2** (ab $3-5/Monat)

### Option 3: Raspberry Pi / Heimserver

**Vorteile:**
- ✅ Einmalige Kosten
- ✅ Läuft zu Hause
- ✅ Vollständige Kontrolle

**Nachteile:**
- ❌ Braucht dauerhafte Internetverbindung
- ❌ Stromkosten
- ❌ Wartung nötig

## 🚀 Schnellstart: Railway Deployment

Railway ist am einfachsten für den Start:

### Schritt 1: Railway Account erstellen
1. Gehe zu [railway.app](https://railway.app)
2. Sign up mit GitHub

### Schritt 2: Projekt erstellen
```bash
# Railway CLI installieren
npm i -g @railway/cli

# Login
railway login

# Projekt initialisieren
railway init
```

### Schritt 3: ENV-Variablen setzen
In Railway Dashboard:
- `TELEGRAM_BOT_TOKEN`
- `OPENAI_API_KEY`
- `ALLOWED_CHAT_IDS`
- `ALLOWED_USER_IDS`
- `OUTBOUND_MODE`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY`

### Schritt 4: Deployen
```bash
railway up
```

Railway erstellt automatisch:
- ✅ Öffentliche URL (HTTPS)
- ✅ Webhook wird automatisch gesetzt
- ✅ Läuft 24/7

## 📋 Vergleich: Lokal vs. Production

| Feature | Lokal (Laptop) | Production (Cloud) |
|---------|----------------|-------------------|
| **Läuft 24/7** | ❌ Nur wenn Laptop an | ✅ Immer |
| **Tunnel nötig** | ✅ (localtunnel/ngrok) | ❌ Eigene URL |
| **Kosten** | €0 (Strom) | $0-10/Monat |
| **Setup** | ✅ Einfach | ⚠️ Etwas aufwändiger |
| **Wartung** | ❌ Manuell | ✅ Automatisch |

## 🔧 Production Setup Checkliste

### 1. Code für Production vorbereiten

```bash
# Build erstellen
pnpm build

# Production-Modus testen
NODE_ENV=production pnpm start
```

### 2. ENV-Variablen in Cloud setzen

Alle `.env` Variablen in Cloud-Provider setzen:
- `TELEGRAM_BOT_TOKEN`
- `OPENAI_API_KEY`
- `ALLOWED_CHAT_IDS`
- `ALLOWED_USER_IDS`
- `OUTBOUND_MODE`
- `GOOGLE_SHEETS_*`
- `PORT` (optional, Cloud setzt automatisch)

### 3. Webhook setzen

Nach Deployment:
```bash
# Neue URL vom Cloud-Provider
pnpm setup-webhook https://your-app.railway.app/webhook
```

### 4. Monitoring

```bash
# Logs ansehen (Cloud-Provider Dashboard)
# Oder:
railway logs  # Railway CLI
```

## 💡 Empfehlung

**Für Start:** Railway (einfach, kostenloser Tier)
**Für Produktion:** VPS (mehr Kontrolle, günstiger langfristig)

## 🔄 Migration von Lokal zu Production

1. **Code ist bereits production-ready** ✅
   - Build vorhanden
   - ENV-Variablen strukturiert
   - Keine lokalen Dependencies

2. **Schritte:**
   ```bash
   # 1. Code zu GitHub pushen
   git add .
   git commit -m "Production ready"
   git push
   
   # 2. In Railway/Render verbinden
   # - GitHub Repo auswählen
   # - ENV-Variablen setzen
   # - Deployen
   
   # 3. Webhook neu setzen
   pnpm setup-webhook <production-url>/webhook
   ```

## 📊 Kosten-Übersicht

| Provider | Kosten | Free Tier |
|----------|--------|-----------|
| Railway | $5/Monat | ✅ 500h/Monat |
| Render | $7/Monat | ✅ Free Tier |
| Fly.io | Pay-as-you-go | ✅ 3 VMs gratis |
| DigitalOcean | $6/Monat | ❌ |
| Hetzner | €4/Monat | ❌ |

**Für diesen Bot:** Meist < $10/Monat

## 🎯 Nächste Schritte

1. **Kurzfristig:** Bot lokal testen (Laptop muss an sein)
2. **Mittelfristig:** Railway/Render Setup (1-2 Stunden)
3. **Langfristig:** VPS für mehr Kontrolle

## 🔗 Links

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Fly.io](https://fly.io)
- [DigitalOcean](https://www.digitalocean.com)

