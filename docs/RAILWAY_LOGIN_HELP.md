# Railway Login Hilfe

## 🔐 Problem: "Unauthorized" Fehler

Falls `railway whoami` "Unauthorized" zeigt:

### Lösung:

1. **Führe aus:**
   ```bash
   railway login
   ```

2. **Browser öffnet sich:**
   - Logge dich in Railway ein
   - Autorisiere CLI-Zugriff
   - Browser schließt sich automatisch

3. **Prüfe:**
   ```bash
   railway whoami
   ```
   Sollte deinen Username zeigen.

## 🔍 Alternative: Token verwenden

Falls Login nicht funktioniert:

1. **Railway Dashboard:**
   - Settings → Tokens
   - Generate new token

2. **Setze Token:**
   ```bash
   export RAILWAY_TOKEN=dein_token
   ```

## ✅ Nach erfolgreichem Login

Dann kann das Deployment automatisch durchgeführt werden:
```bash
railway init
railway up
```

## 💡 Tipp

Login-Status prüfen:
```bash
railway whoami
```

Sollte deinen Railway-Username zeigen, nicht "Unauthorized".

