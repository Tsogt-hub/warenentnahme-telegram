# GitHub Repository erstellen - Schritt für Schritt

## 🚀 Schritt 1: GitHub Repository erstellen

1. **Gehe zu GitHub:**
   - Öffne: https://github.com/new
   - Oder: GitHub → "New Repository"

2. **Repository-Einstellungen:**
   - **Repository name:** `warenentnahme-telegram`
   - **Description:** (optional) "Warenentnahme Bot via Telegram"
   - **Visibility:** Private (empfohlen) oder Public
   - ❌ **NICHT** "Initialize with README" ankreuzen
   - ❌ **NICHT** .gitignore oder License hinzufügen

3. **Klicke auf "Create repository"**

## 📤 Schritt 2: Code zu GitHub pushen

**Im Terminal (auf deinem Laptop):**

```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram

# Git initialisieren (falls noch nicht)
git init

# Alle Dateien hinzufügen
git add .

# Commit
git commit -m "Initial commit - Warenentnahme Bot"

# GitHub Repository verbinden
git remote add origin https://github.com/tsogt-hub/warenentnahme-telegram.git

# Pushen
git push -u origin main
```

**Falls git fragt nach Username/Password:**
- Username: `tsogt-hub`
- Password: `nijryc-8zAfhu-dezbiz`
- Oder: GitHub Personal Access Token verwenden

## 🔗 Schritt 3: In Railway verbinden

1. **Gehe zurück zu Railway**
2. **Wähle: "GitHub Repository"**
3. **Suche nach:** `warenentnahme-telegram`
4. **Wähle das Repository**
5. **Railway deployt automatisch!**

## ✅ Fertig!

Nach dem Deployment:
- Railway gibt URL: `https://your-app.railway.app`
- Setze ENV-Variablen im Dashboard
- Webhook setzen: `pnpm setup-webhook https://your-app.railway.app/webhook`

## 🔐 Sicherheit

**WICHTIG:** Speichere Zugangsdaten nie in Dateien!
- ✅ Verwende GitHub Personal Access Token (empfohlen)
- ✅ Oder: SSH Keys für Git
- ❌ Keine Passwörter im Code

## 💡 Alternative: Personal Access Token

Für bessere Sicherheit:

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token"
3. Scopes: `repo` (vollständiger Zugriff)
4. Token kopieren
5. Verwende Token statt Passwort beim Git Push

