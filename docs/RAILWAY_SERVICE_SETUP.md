# Railway Service Setup

## 🚀 Service erstellen

Nachdem das Projekt verlinkt ist, muss ein Service erstellt werden.

## 📋 Schritt-für-Schritt

### Option 1: Im Railway Dashboard (Empfohlen)

1. **Gehe zu Railway Dashboard:**
   - Öffne: https://railway.app/dashboard
   - Klicke auf Projekt: `prolific-dedication`

2. **Erstelle Service:**
   - Klicke: "New Service"
   - Wähle: "Empty Service" oder "GitHub Repo"
   - Service wird erstellt

3. **Code deployen:**
   - Im Dashboard: "Deploy" oder "Deploy from GitHub"
   - Oder: `railway up` im Terminal

### Option 2: Über CLI

1. **Service erstellen/linken:**
   ```bash
   railway service
   ```
   - Wählt Service aus oder erstellt neuen

2. **Code deployen:**
   ```bash
   railway up
   ```

## ⚙️ Service-Konfiguration

Nach Service-Erstellung:

1. **Build Settings:**
   - Railway erkennt automatisch Node.js
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`

2. **ENV-Variablen:**
   - Railway Dashboard → Variables Tab
   - Füge alle Variablen hinzu

3. **Domain:**
   - Railway Dashboard → Settings → Domains
   - Railway gibt automatisch eine URL

## ✅ Nach Service-Erstellung

```bash
railway up
```

Deployt Code zum Service.

## 💡 Tipp

Service-Status prüfen:
```bash
railway status
```

Sollte Service-Informationen zeigen.

