# Railway Login --browserless

## 🔐 Problem: Browser-Login schlägt fehl

Wenn `railway login` einen Fehler zeigt, verwende `--browserless`.

## 📋 Schritt-für-Schritt

### Option 1: Browserless mit Token

1. **Führe aus:**
   ```bash
   railway login --browserless
   ```

2. **Railway zeigt:**
   - Eine URL (z.B. `https://railway.app/authorize?token=...`)
   - Einen Token

3. **Gehe zu der URL:**
   - Öffne die URL im Browser
   - Oder kopiere den Token

4. **Autorisiere:**
   - Im Browser logge dich ein
   - Autorisiere CLI-Zugriff

5. **Prüfe:**
   ```bash
   railway whoami
   ```
   Sollte deinen Username zeigen.

### Option 2: Token direkt verwenden

1. **Railway Dashboard:**
   - Gehe zu: https://railway.app/account/tokens
   - Oder: Settings → Tokens

2. **Erstelle Token:**
   - Klicke "New Token"
   - Name: z.B. "CLI Access"
   - Kopiere den Token

3. **Setze Token:**
   ```bash
   export RAILWAY_TOKEN=dein_token_hier
   ```

4. **Prüfe:**
   ```bash
   railway whoami
   ```

## ✅ Nach erfolgreichem Login

Dann kann das Deployment automatisch durchgeführt werden:
```bash
railway init
railway up
```

## 💡 Tipp

Falls `--browserless` auch nicht funktioniert:
- Verwende Token-Methode (Option 2)
- Oder: Prüfe Railway CLI Version: `railway --version`
- Update: `npm i -g @railway/cli@latest`

