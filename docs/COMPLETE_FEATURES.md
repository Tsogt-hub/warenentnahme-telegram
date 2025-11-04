# Komplette Feature-Übersicht - Troubleshooting & Monitoring

## 🎯 Übersicht

Das Bot-System wurde um umfassende Troubleshooting- und Monitoring-Tools erweitert, die das Debugging und die Wartung erheblich vereinfachen.

## 🔧 Troubleshooting-Tools

### 1. Diagnose (`pnpm diagnose`)
**Vollständige Systemdiagnose mit 5 Prüfungen:**

- ✅ ENV-Variablen (Token, API-Keys, Chat/User-IDs)
- ✅ Telegram Webhook-Status (URL, Pending Updates, Fehler)
- ✅ Server-Erreichbarkeit (Health-Check, Cache-Status)
- ✅ Tunnel-Status (localtunnel/ngrok Prozess)
- ✅ Webhook-Info-Endpoint (optional)

**Ausgabe:**
- Alle Probleme auf einen Blick
- Konkrete Lösungsvorschläge
- Nächste Schritte

**Beispiel:**
```bash
$ pnpm diagnose

🔍 Bot-Diagnose gestartet...
1️⃣ ENV-Variablen: ✅
2️⃣ Telegram Webhook-Status: ✅
3️⃣ Server-Erreichbarkeit: ✅
4️⃣ Tunnel-Status: ❌ (Kein Tunnel-Prozess gefunden)
5️⃣ Webhook-Info-Endpoint: ✅
```

### 2. Quick-Fix (`pnpm quick-fix`)
**Automatischer Fix für häufige Probleme:**

- ✅ Löscht pending Updates automatisch
- ✅ Setzt Webhook neu
- ✅ Prüft Server-Status
- ✅ Gibt konkrete nächste Schritte

**Verwendung:**
```bash
pnpm quick-fix
```

### 3. Clear Pending (`pnpm clear-pending`)
**Löscht blockierende Telegram Updates:**

- Entfernt pending Updates
- Setzt Webhook automatisch neu
- Verhindert doppelte Verarbeitung

### 4. Auto-Setup (`pnpm auto-setup`)
**Setup-Wizard für automatische Einrichtung:**

1. Prüft ENV-Variablen
2. Prüft ob Server läuft
3. Prüft Tunnel-Status
4. Setzt Webhook (falls möglich)
5. Löscht pending Updates

**Ausgabe:**
```
📋 Setup-Zusammenfassung:
   ✅ ENV-Variablen
   ✅ Server
   ❌ Tunnel (Tunnel nicht gestartet)
   ✅ Pending Updates
   ✅ Webhook

✅ 4/6 Schritte erfolgreich
```

## 🐕 Monitoring-Tools

### 5. Watchdog (`pnpm watchdog`)
**Kontinuierliche Systemüberwachung:**

- Prüft alle 30 Sekunden:
  - Server-Erreichbarkeit
  - Tunnel-Status
  - Webhook-Status
  - Pending Updates
  - Webhook-Fehler

**Ausgabe:**
```
[14:30:15] ✅ System OK
```

Bei Problemen:
```
[14:30:45] System-Status:
  Server:   ✅
  Tunnel:   ❌
  Webhook:  ✅ (⚠️  2 pending)
  Status:   ⚠️  PROBLEME
```

**Verwendung:**
```bash
# Terminal 1: Server
pnpm dev

# Terminal 2: Tunnel
lt --port 3000 --subdomain warenentnahme-bot

# Terminal 3: Watchdog
pnpm watchdog
```

## 📋 Alle verfügbaren Commands

| Command | Beschreibung | Verwendung |
|---------|-------------|------------|
| `pnpm diagnose` | Vollständige Diagnose | Bei Problemen |
| `pnpm quick-fix` | Automatischer Fix | Schnelle Lösung |
| `pnpm clear-pending` | Pending Updates löschen | Bei blockierten Updates |
| `pnpm check-webhook` | Webhook-Status prüfen | Webhook-Verifizierung |
| `pnpm setup-webhook <url>` | Webhook setzen | Initial Setup |
| `pnpm delete-webhook` | Webhook löschen | Reset |
| `pnpm start-tunnel` | Tunnel starten | Tunnel-Automation |
| `pnpm watchdog` | Kontinuierliche Überwachung | Monitoring |
| `pnpm auto-setup` | Setup-Wizard | Automatische Einrichtung |

## 🚀 Workflows

### Workflow 1: Erstes Setup
```bash
# 1. Auto-Setup ausführen
pnpm auto-setup

# 2. Server starten (falls nicht läuft)
pnpm dev

# 3. Tunnel starten
lt --port 3000 --subdomain warenentnahme-bot

# 4. Webhook setzen
pnpm setup-webhook https://warenentnahme-bot.loca.lt/webhook

# 5. Status prüfen
pnpm diagnose
```

### Workflow 2: Bot reagiert nicht
```bash
# 1. Diagnose ausführen
pnpm diagnose

# 2. Quick-Fix versuchen
pnpm quick-fix

# 3. Falls weiterhin Probleme: Detaillierte Analyse
pnpm diagnose
```

### Workflow 3: Kontinuierliche Überwachung
```bash
# Terminal 1: Server
pnpm dev

# Terminal 2: Tunnel
lt --port 3000 --subdomain warenentnahme-bot

# Terminal 3: Watchdog
pnpm watchdog
```

### Workflow 4: Notfall-Reset
```bash
# 1. Alles zurücksetzen
pnpm delete-webhook
pnpm clear-pending

# 2. Auto-Setup
pnpm auto-setup

# 3. Server neu starten
pnpm dev

# 4. Status prüfen
pnpm diagnose
```

## 📚 Dokumentation

- **`docs/BOT_TROUBLESHOOTING.md`** - Detaillierte Troubleshooting-Anleitung
- **`docs/QUICK_FIX_GUIDE.md`** - Quick-Fix-Guide mit allen Commands
- **`docs/WATCHDOG_GUIDE.md`** - Watchdog-Anleitung
- **`docs/CHANGELOG_TROUBLESHOOTING.md`** - Changelog der neuen Features
- **`README.md`** - Troubleshooting-Abschnitt erweitert

## 💡 Vorteile

1. **Zeitersparnis**: Probleme werden sofort erkannt
2. **Einfacheres Debugging**: Alle Infos auf einen Blick
3. **Automatische Fixes**: Viele Probleme werden automatisch behoben
4. **Kontinuierliche Überwachung**: Watchdog erkennt Probleme sofort
5. **Bessere Dokumentation**: Klare Anleitungen für alle Probleme
6. **Setup-Automatisierung**: Auto-Setup macht Einrichtung einfacher

## 🎯 Best Practices

1. **Nach Setup**: `pnpm diagnose` ausführen
2. **Bei Problemen**: `pnpm quick-fix` versuchen
3. **Für Production**: `pnpm watchdog` im Hintergrund laufen lassen
4. **Nach Änderungen**: `pnpm diagnose` zur Verifizierung

## 🔄 Integration in CI/CD

Die Tools können auch in CI/CD-Pipelines integriert werden:

```yaml
# Beispiel GitHub Action
- name: Diagnose
  run: pnpm diagnose

- name: Quick-Fix
  run: pnpm quick-fix
```

## 📊 Status-Übersicht

**Aktueller Status (aus Diagnose):**
- ✅ Server läuft
- ✅ Webhook gesetzt
- ✅ Keine pending Updates
- ❌ Tunnel läuft nicht (Hauptproblem)

**Lösung:**
```bash
lt --port 3000 --subdomain warenentnahme-bot
```


