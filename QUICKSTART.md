# Quick Start Guide

Schnelleinstieg in den Warenentnahme-via-Telegram Service.

## 1. Voraussetzungen

- Node.js 20+ installiert
- pnpm installiert (`npm install -g pnpm`)
- Telegram Bot-Token (von [@BotFather](https://t.me/BotFather))
- Claude API-Key (von [Anthropic Console](https://console.anthropic.com/))

## 2. Setup (5 Minuten)

```bash
# 1. Dependencies installieren
pnpm install

# 2. ENV konfigurieren
cp .env.example .env
# .env mit deinen Werten füllen:
# - TELEGRAM_BOT_TOKEN
# - CLAUDE_API_KEY
# - ALLOWED_CHAT_IDS
# - ALLOWED_USER_IDS
# - GOOGLE_SHEETS_SPREADSHEET_ID (optional, für Sheets-Integration)
# - GOOGLE_SERVICE_ACCOUNT_KEY (optional, für Sheets-Integration)

# 3. Build & Start
pnpm build
pnpm start

# Server läuft auf http://localhost:3000
```

### Google Sheets Setup (optional)

Falls du Google Sheets als Zielsystem nutzen möchtest:

1. Siehe [docs/SHEETS_SETUP.md](docs/SHEETS_SETUP.md) für detaillierte Anleitung
2. Kurzfassung:
   - Google Cloud Project erstellen
   - Google Sheets API aktivieren
   - Service Account erstellen & Key herunterladen
   - Spreadsheet mit Service Account E-Mail teilen
   - ENV-Variablen setzen

## 3. Webhook konfigurieren

### Lokale Entwicklung (mit ngrok):

```bash
# Terminal 1: Server starten
pnpm dev

# Terminal 2: ngrok starten
ngrok http 3000
# Kopiere die HTTPS-URL (z.B. https://abc123.ngrok.io)

# Terminal 3: Webhook setzen
pnpm setup-webhook https://abc123.ngrok.io/webhook
```

### Production:

```bash
pnpm setup-webhook https://your-domain.com/webhook
```

## 4. Testen

Sende eine Nachricht an deinen Bot:

```
nimm 3x M8-Schrauben aus Regal A3 für Auftrag 1234
```

Der Bot sollte antworten mit einer Bestätigung.

## 5. Überprüfen

```bash
# Health-Check
curl http://localhost:3000/health

# Webhook-Info
curl http://localhost:3000/webhook/info
```

## Nützliche Commands

```bash
# Development mit Watch-Mode
pnpm dev

# Tests ausführen
pnpm test

# Type-Check
pnpm type-check

# Webhook löschen
pnpm delete-webhook

# Webhook neu setzen
pnpm setup-webhook <url>
```

## Troubleshooting

### Bot antwortet nicht
- Prüfe Webhook-Status: `pnpm setup-webhook` zeigt Info
- Prüfe Logs im Server-Output
- Prüfe `ALLOWED_CHAT_IDS` / `ALLOWED_USER_IDS` in `.env`

### OpenAI API Fehler
- Prüfe `OPENAI_API_KEY` in `.env`
- Prüfe API-Key Gültigkeit und Credits

### Webhook-Fehler
- Stelle sicher, dass Server läuft
- Prüfe URL (muss HTTPS sein, außer localhost)
- Prüfe Firewall/Port-Weiterleitung

## Nächste Schritte

- Siehe [README.md](README.md) für vollständige Dokumentation
- Adapter implementieren (Sheets/Trello/OpusFlow)
- Idempotenz-Cache auf persistente Storage umstellen

