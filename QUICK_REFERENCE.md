# Quick Reference - Alle Commands

## 🚀 Start & Setup

```bash
# Alles automatisch starten
pnpm start

# Server starten
pnpm dev

# Mit Debug-Logs
LOG_LEVEL=debug pnpm dev

# Auto-Setup (prüft alles)
pnpm auto-setup
```

## 🔍 Diagnose & Monitoring

```bash
# Vollständige Diagnose
pnpm diagnose

# Quick-Fix (automatisch)
pnpm quick-fix

# Watchdog (kontinuierliche Überwachung)
pnpm watchdog

# Voice Messages Monitor
pnpm monitor-voice
```

## 🎤 Voice Messages

```bash
# Konfiguration prüfen
pnpm monitor-voice

# Test Voice Webhook
pnpm tsx scripts/test-voice-webhook.ts
```

## 🔧 Webhook Management

```bash
# Webhook setzen
pnpm setup-webhook <url>

# Webhook Status prüfen
pnpm check-webhook

# Webhook löschen
pnpm delete-webhook

# Pending Updates löschen
pnpm clear-pending
```

## 📊 Status & Info

```bash
# Server Health
curl http://localhost:3000/health

# Webhook Info
curl http://localhost:3000/webhook/info
```

## 🐛 Troubleshooting

### Bot reagiert nicht
```bash
# 1. Diagnose
pnpm diagnose

# 2. Quick-Fix
pnpm quick-fix

# 3. Logs prüfen
LOG_LEVEL=debug pnpm dev
```

### Voice Messages funktionieren nicht
```bash
# 1. Monitor prüfen
pnpm monitor-voice

# 2. ENV prüfen
echo $OPENAI_API_KEY

# 3. Logs prüfen
LOG_LEVEL=debug pnpm dev
```

## 📚 Dokumentation

- `docs/VOICE_MESSAGES.md` - Voice Messages Anleitung
- `docs/BOT_TROUBLESHOOTING.md` - Troubleshooting
- `docs/QUICK_FIX_GUIDE.md` - Quick-Fix Guide
- `docs/WATCHDOG_GUIDE.md` - Watchdog Anleitung
- `docs/START_GUIDE.md` - Start-Anleitung

## 🎯 Wichtigste Commands

| Command | Beschreibung |
|---------|-------------|
| `pnpm diagnose` | Vollständige Diagnose |
| `pnpm quick-fix` | Automatischer Fix |
| `pnpm monitor-voice` | Voice Messages prüfen |
| `pnpm watchdog` | Kontinuierliche Überwachung |
| `pnpm start` | Alles automatisch starten |


