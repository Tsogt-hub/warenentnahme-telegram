# Start-Guide - Bot schnell starten

## 🚀 Schnellstart

### Option 1: Alles automatisch starten
```bash
bash scripts/start-bot.sh
```

Oder:
```bash
pnpm start
```

Dieses Script:
- ✅ Prüft ob Server läuft
- ✅ Startet Tunnel automatisch
- ✅ Setzt Webhook
- ✅ Führt Diagnose aus

### Option 2: Manuell starten

**Terminal 1: Server**
```bash
pnpm dev
```

**Terminal 2: Tunnel**
```bash
lt --port 3000 --subdomain warenentnahme-bot
```

**Terminal 3: Webhook setzen**
```bash
pnpm setup-webhook https://warenentnahme-bot.loca.lt/webhook
```

**Terminal 4: Status prüfen (optional)**
```bash
pnpm diagnose
```

## ✅ Status prüfen

```bash
# Vollständige Diagnose
pnpm diagnose

# Nur Webhook-Status
pnpm check-webhook

# Kontinuierliche Überwachung
pnpm watchdog
```

## 🧪 Testen

1. **Telegram öffnen**
2. **Zur Gruppe gehen** (ID: -5025798709)
3. **Test-Nachricht senden:**
   ```
   nimm 3x M8-Schrauben aus Regal A3
   ```
4. **Bot sollte antworten** ✅

## 🔧 Troubleshooting

### Bot antwortet nicht?

```bash
# 1. Diagnose ausführen
pnpm diagnose

# 2. Quick-Fix versuchen
pnpm quick-fix

# 3. Watchdog für Monitoring
pnpm watchdog
```

### Häufige Probleme

**Problem: "Server läuft nicht"**
```bash
pnpm dev
```

**Problem: "Tunnel läuft nicht"**
```bash
lt --port 3000 --subdomain warenentnahme-bot
```

**Problem: "Webhook nicht gesetzt"**
```bash
pnpm setup-webhook https://warenentnahme-bot.loca.lt/webhook
```

**Problem: "Pending Updates"**
```bash
pnpm clear-pending
```

## 📊 Monitoring

Für kontinuierliche Überwachung:

```bash
# Terminal 1: Server
pnpm dev

# Terminal 2: Tunnel
lt --port 3000 --subdomain warenentnahme-bot

# Terminal 3: Watchdog
pnpm watchdog
```

Der Watchdog zeigt alle 30 Sekunden den Status:
```
[14:30:15] ✅ System OK
```

Bei Problemen:
```
[14:30:45] System-Status:
  Server:   ✅
  Tunnel:   ❌
  Webhook:  ✅
  Status:   ⚠️  PROBLEME
```

## 🎯 Best Practices

1. **Nach dem Start**: `pnpm diagnose` ausführen
2. **Für Production**: `pnpm watchdog` im Hintergrund
3. **Bei Problemen**: `pnpm quick-fix` versuchen
4. **Nach Änderungen**: Status mit `pnpm diagnose` prüfen


