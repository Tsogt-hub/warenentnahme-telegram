# Railway - Empty Project Setup

## Option 1: Empty Project (Empfohlen für Start)

Wenn du noch kein GitHub Repository hast:

### Schritt 1: Wähle "Empty Project"

1. Klicke auf **"Empty Project"**
2. Railway erstellt ein neues Projekt

### Schritt 2: Code hochladen

**Option A: Railway CLI (Empfohlen)**

```bash
# Railway CLI installieren
npm i -g @railway/cli

# Login
railway login

# Im Projekt-Verzeichnis
cd /Users/tsogtnandin-erdene/warenentnahme-telegram

# Projekt initialisieren
railway init

# Code deployen
railway up
```

**Option B: GitHub erstellen (Später möglich)**

1. Erstelle GitHub Repository
2. Code pushen
3. In Railway verbinden

### Schritt 3: ENV-Variablen setzen

Im Railway Dashboard → Variables:

```bash
TELEGRAM_BOT_TOKEN=...
OPENAI_API_KEY=...
ALLOWED_CHAT_IDS=-5025798709
ALLOWED_USER_IDS=6377811171
OUTBOUND_MODE=sheets
```

### Schritt 4: Webhook setzen

Nach Deployment:
```bash
pnpm setup-webhook https://your-app.railway.app/webhook
```

## Option 2: GitHub Repository erstellen (Empfohlen langfristig)

### Vorteile:
- ✅ Versionskontrolle
- ✅ Automatisches Deployment bei Push
- ✅ Backup deines Codes

### Schritt 1: GitHub Repository erstellen

1. Gehe zu [github.com](https://github.com)
2. Klicke auf "New Repository"
3. Name: `warenentnahme-telegram`
4. Erstelle Repository (privat oder öffentlich)

### Schritt 2: Code pushen

```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram

# Git initialisieren (falls noch nicht)
git init

# Alle Dateien hinzufügen
git add .

# Commit
git commit -m "Initial commit"

# GitHub Repository verbinden
git remote add origin https://github.com/dein-username/warenentnahme-telegram.git

# Pushen
git push -u origin main
```

### Schritt 3: In Railway verbinden

1. In Railway: "GitHub Repository" wählen
2. Repository auswählen
3. Railway deployt automatisch

## 💡 Empfehlung

**Für jetzt:** "Empty Project" + Railway CLI (schnell)
**Für später:** GitHub Repository erstellen (besser für Versionskontrolle)

## 🚀 Schnellstart mit Empty Project

```bash
# 1. Railway CLI installieren
npm i -g @railway/cli

# 2. Login
railway login

# 3. Im Projekt-Verzeichnis
cd /Users/tsogtnandin-erdene/warenentnahme-telegram

# 4. Projekt initialisieren
railway init

# 5. Deployen
railway up
```

Dann ENV-Variablen im Dashboard setzen und fertig!

