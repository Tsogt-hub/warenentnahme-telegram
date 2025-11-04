# Quick-Fix Guide - Bot reagiert nicht?

## 🚀 Schnellstart

### 1. Diagnose ausführen
```bash
pnpm diagnose
```
Zeigt alle Probleme auf einen Blick.

### 2. Automatischer Quick-Fix
```bash
pnpm quick-fix
```
Versucht automatisch alle Probleme zu beheben (pending Updates löschen, etc.)

### 3. Manuelle Fixes

#### Pending Updates löschen
```bash
pnpm clear-pending
```

#### Webhook-Status prüfen
```bash
pnpm check-webhook
```

#### Webhook neu setzen
```bash
# 1. Tunnel starten (in neuem Terminal)
lt --port 3000 --subdomain warenentnahme-bot
# oder
ngrok http 3000

# 2. Webhook setzen
pnpm setup-webhook https://warenentnahme-bot.loca.lt/webhook
```

## 📋 Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `pnpm diagnose` | Vollständige Diagnose aller Komponenten |
| `pnpm quick-fix` | Automatischer Fix für häufige Probleme |
| `pnpm clear-pending` | Löscht pending Telegram Updates |
| `pnpm check-webhook` | Zeigt Webhook-Status und Fehler |
| `pnpm setup-webhook <url>` | Setzt Webhook-URL |
| `pnpm delete-webhook` | Löscht Webhook komplett |
| `pnpm watchdog` | Überwacht System kontinuierlich (alle 30s) |
| `pnpm auto-setup` | Richtet alles automatisch ein (Setup-Wizard) |

## 🔍 Häufige Probleme

### Problem: "503 Service Unavailable"
**Ursache:** Tunnel läuft nicht  
**Lösung:**
```bash
lt --port 3000 --subdomain warenentnahme-bot
```

### Problem: "Pending Updates > 0"
**Ursache:** Alte Updates warten auf Verarbeitung  
**Lösung:**
```bash
pnpm clear-pending
```

### Problem: "Server nicht erreichbar"
**Ursache:** Server läuft nicht  
**Lösung:**
```bash
pnpm dev
```

### Problem: "Webhook nicht gesetzt"
**Ursache:** Webhook-URL fehlt  
**Lösung:**
```bash
# Tunnel starten, dann:
pnpm setup-webhook <url>/webhook
```

## ✅ Checkliste vor dem Testen

- [ ] Server läuft: `pnpm dev`
- [ ] Tunnel läuft: `lt --port 3000 --subdomain warenentnahme-bot`
- [ ] Webhook gesetzt: `pnpm check-webhook`
- [ ] Keine pending Updates: `pnpm diagnose`
- [ ] Keine Fehler in Webhook-Status: `pnpm check-webhook`

## 🆘 Notfall-Reset

Wenn gar nichts mehr funktioniert:

```bash
# 1. Alles zurücksetzen
pnpm delete-webhook
pnpm clear-pending

# 2. Server neu starten
pnpm dev

# 3. Tunnel neu starten (neues Terminal)
lt --port 3000 --subdomain warenentnahme-bot

# 4. Webhook neu setzen
pnpm setup-webhook https://warenentnahme-bot.loca.lt/webhook

# 5. Status prüfen
pnpm diagnose
```

