# Bot-Troubleshooting: Bot reagiert nicht

## Problem: Bot antwortet nicht auf Nachrichten

### 🔍 Schnell-Diagnose

```bash
pnpm diagnose
```

Dieses Script prüft automatisch:
- ✅ ENV-Variablen
- ✅ Webhook-Status
- ✅ Server-Erreichbarkeit
- ✅ Pending Updates

### ❌ Häufige Ursachen

#### 1. Tunnel läuft nicht (503 Service Unavailable)

**Symptom:**
- Webhook-URL nicht erreichbar
- Fehler: "503 Service Unavailable" oder "Connection timed out"
- Pending Updates > 0

**Lösung:**
```bash
# Option A: localtunnel starten
lt --port 3000 --subdomain warenentnahme-bot

# Option B: ngrok starten
ngrok http 3000

# Dann Webhook neu setzen:
pnpm setup-webhook <url>/webhook
```

#### 2. Server läuft nicht

**Symptom:**
- Server-Erreichbarkeit: ❌ Nicht erreichbar
- Keine Logs im Terminal

**Lösung:**
```bash
# Server starten
pnpm dev

# Oder mit Debug-Logging:
LOG_LEVEL=debug pnpm dev
```

#### 3. Webhook nicht gesetzt

**Symptom:**
- Webhook-URL: ❌ NICHT GESETZT
- Pending Updates: 0

**Lösung:**
```bash
# Webhook setzen
pnpm setup-webhook https://your-url.com/webhook
```

#### 4. Pending Updates blockieren

**Symptom:**
- Pending Updates > 0
- Letzter Fehler vorhanden

**Lösung:**
```bash
# Pending Updates löschen
pnpm clear-pending

# Webhook wird automatisch wieder gesetzt
```

#### 5. Authorization-Problem

**Symptom:**
- Server läuft, Webhook erreichbar
- Bot antwortet nicht
- Logs zeigen: "Outbound-Integration übersprungen (nicht autorisiert)"

**Lösung:**
```bash
# Prüfe .env:
# ALLOWED_CHAT_IDS=-5025798709
# ALLOWED_USER_IDS=6377811171

# Prüfe ob Chat-ID/User-ID korrekt sind
```

### ✅ Checkliste

Bevor du eine Nachricht sendest, stelle sicher:

- [ ] Server läuft (`pnpm dev`)
- [ ] Tunnel läuft (`lt` oder `ngrok`)
- [ ] Webhook gesetzt (`pnpm check-webhook`)
- [ ] Keine pending Updates (`pnpm diagnose`)
- [ ] Chat-ID/User-ID korrekt (.env)

### 🔧 Manueller Test

```bash
# Terminal 1: Debug-Server starten
pnpm tsx scripts/debug-webhook.ts

# Terminal 2: Test-Request senden
curl "http://localhost:3000/test?message=nimm%205x%20Schrauben"
```

### 📋 Logs prüfen

```bash
# Server mit Debug-Logging starten
LOG_LEVEL=debug pnpm dev
```

**Was du sehen solltest:**
```
[INFO] Telegram Update empfangen
  chatId: -5025798709
  messageId: 123
  text: "nimm 3x Schrauben"
[INFO] Claude parse successful
[INFO] Starte Outbound-Integration
```

### 🚨 Notfall-Reset

Wenn nichts mehr funktioniert:

```bash
# 1. Webhook löschen
pnpm delete-webhook

# 2. Pending Updates löschen
pnpm clear-pending

# 3. Server neu starten
pnpm dev

# 4. Tunnel neu starten
lt --port 3000 --subdomain warenentnahme-bot

# 5. Webhook neu setzen
pnpm setup-webhook https://warenentnahme-bot.loca.lt/webhook

# 6. Status prüfen
pnpm diagnose
```


