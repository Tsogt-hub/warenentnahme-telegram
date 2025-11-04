# Watchdog-Guide - Kontinuierliche Überwachung

## 🐕 Was ist der Watchdog?

Der Watchdog ist ein Monitoring-Tool, das dein Bot-System kontinuierlich überwacht und bei Problemen warnt.

## 🚀 Verwendung

```bash
pnpm watchdog
```

Der Watchdog prüft alle **30 Sekunden**:
- ✅ Server-Erreichbarkeit
- ✅ Tunnel-Status (localtunnel/ngrok)
- ✅ Webhook-Status
- ✅ Pending Updates
- ✅ Webhook-Fehler

## 📊 Ausgabe

### Bei gesundem System:
```
[14:30:15] ✅ System OK
```

### Bei Problemen:
```
[14:30:45] System-Status:
  Server:   ✅
  Tunnel:   ❌
  Webhook:  ✅ (⚠️  2 pending)
  Status:   ⚠️  PROBLEME

   💡 Tunnel läuft nicht: lt --port 3000 --subdomain warenentnahme-bot
   💡 Pending Updates: pnpm clear-pending
```

## 💡 Verwendungsszenarien

### 1. Während der Entwicklung
```bash
# Terminal 1: Server
pnpm dev

# Terminal 2: Tunnel
lt --port 3000 --subdomain warenentnahme-bot

# Terminal 3: Watchdog
pnpm watchdog
```

### 2. Production-Überwachung
```bash
# Im Hintergrund starten
nohup pnpm watchdog > watchdog.log 2>&1 &
```

### 3. Debugging
Wenn der Bot nicht reagiert, starte den Watchdog um zu sehen, was schief läuft:
```bash
pnpm watchdog
```

## 🔔 Alarme

Der Watchdog gibt Warnungen aus bei:
- ❌ Server läuft nicht
- ❌ Tunnel läuft nicht
- ❌ Webhook nicht gesetzt
- ⚠️  Pending Updates vorhanden
- ❌ Webhook-Fehler

Nach **3 aufeinanderfolgenden Fehlern** wird eine Zusammenfassung ausgegeben:
```
⚠️  Mehrere aufeinanderfolgende Fehler erkannt!
💡 Führe 'pnpm diagnose' aus für vollständige Analyse.
```

## 🛑 Beenden

Zum Beenden: `Ctrl+C`

## 📝 Logs

Für detaillierte Logs:
```bash
pnpm watchdog 2>&1 | tee watchdog.log
```

## ⚙️ Konfiguration

Die Check-Intervalle können in `scripts/watchdog.ts` angepasst werden:
```typescript
const checkInterval = 30000; // 30 Sekunden (Standard)
const maxErrors = 3; // Anzahl Fehler bis Warnung
```

## 🔄 Kombination mit anderen Tools

**Setup + Watchdog:**
```bash
# 1. Auto-Setup ausführen
pnpm auto-setup

# 2. Watchdog starten
pnpm watchdog
```

**Diagnose + Watchdog:**
```bash
# 1. Vollständige Diagnose
pnpm diagnose

# 2. Watchdog für kontinuierliche Überwachung
pnpm watchdog
```

## 💡 Tipps

1. **Watchdog im Hintergrund**: Für Production kann der Watchdog als Service laufen
2. **Kombiniere mit Logs**: Watchdog + Server-Logs geben vollständiges Bild
3. **Bei Problemen**: Watchdog zeigt sofort, was nicht funktioniert


