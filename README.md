# Warenentnahme via Telegram


Mini-Service für Warenentnahme via Telegram → LLM-Parser → Zielsystem (Sheets/Trello/OpusFlow) → Telegram-Reply.

## Technologie-Stack

- **Node.js 20+** mit TypeScript (ESM)
- **pnpm** als Paketmanager
- **Hono** für Webhook/API
- **grammY** für Telegram-Integration
- **Claude API** (Anthropic) für LLM-Parsing
- **Zod** für Schema-Validierung
- **pino** für Logging
- **Vitest** für Tests

## Setup

### 1. Dependencies installieren

```bash
pnpm install
```

### 2. Umgebungsvariablen konfigurieren

Kopiere `.env.example` nach `.env` und fülle die Werte:

```bash
cp .env.example .env
```

Wichtig:
- `TELEGRAM_BOT_TOKEN`: Bot-Token von [@BotFather](https://t.me/BotFather)
- `OPENAI_API_KEY`: OpenAI API-Key
- `ALLOWED_CHAT_IDS`: Komma-getrennte Chat-IDs (z.B. `-5025798709`)
- `ALLOWED_USER_IDS`: Komma-getrennte User-IDs (z.B. `6377811171`)
- `OUTBOUND_MODE`: `sheets`, `trello` oder `opusflow`

### 3. Bot-Webhook konfigurieren

Nach Start des Servers, setze Webhook-URL:

**Mit Setup-Script (empfohlen):**
```bash
# Für lokale Entwicklung mit ngrok:
ngrok http 3000
# Dann Webhook setzen:
pnpm setup-webhook https://your-ngrok-url.ngrok.io/webhook

# Für Production:
pnpm setup-webhook https://your-domain.com/webhook
```

**Manuell:**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-domain.com/webhook"
```

**Webhook löschen:**
```bash
pnpm delete-webhook
```

### 4. Development

```bash
pnpm dev
```

### 5. Production Build

```bash
pnpm build
pnpm start
```

## Tests

```bash
# Alle Tests
pnpm test

# Mit Coverage
pnpm test:coverage

# Type-Check
pnpm type-check
```

## Projektstruktur

```
warenentnahme-telegram/
├── src/
│   ├── adapters/          # Outbound-Adapter (Sheets/Trello/OpusFlow)
│   │   ├── sheets.ts
│   │   ├── trello.ts
│   │   └── opusflow.ts
│   ├── routes/            # Webhook-Routes
│   │   └── telegram.ts
│   ├── auth.ts            # Authorization-Guards
│   ├── bus.ts             # Idempotenz-Cache
│   ├── parser.ts          # LLM-Parser mit OpenAI
│   ├── schema.ts          # Zod-Schemas
│   └── index.ts           # Entry Point
├── scripts/               # Utility-Scripts
│   ├── setup-webhook.ts   # Webhook konfigurieren
│   └── delete-webhook.ts  # Webhook löschen
├── tests/                 # Vitest-Tests
├── .env.example           # ENV-Template
├── .cursorrules           # Cursor System-Prompt
└── README.md
```

## Workflow

1. **Telegram-Nachricht** → Webhook empfängt Update
2. **Idempotenz-Check** → Verhindert Duplikate via `request_id`
3. **Authorization** → Prüft Chat-ID / User-ID
4. **LLM-Parser** → Extrahiert strukturierte Daten (OpenAI)
5. **Outbound-Dispatch** → Schreibt in Sheets/Trello/OpusFlow
6. **Telegram-Reply** → Bestätigung an User

## Beispiel-Nachrichten

- `"nimm 3x M8-Schrauben aus Regal A3 für Auftrag 1234"`
- `"entnimm 2 Rollen NYM-J 3x1,5 Lager: Kabelwand A"`
- `"zurück 1x Makita Akkuschrauber Kiste B2"`
- `"inventur M6 Mutter 250 Stk Lager D1"`

## ENV-Variablen

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot-Token von BotFather | `123456:ABC...` |
| `CLAUDE_API_KEY` | Claude API-Key (Anthropic) | `sk-ant-...` |
| `ALLOWED_CHAT_IDS` | Erlaubte Chat-IDs (komma-separiert) | `-5025798709,123456` |
| `ALLOWED_USER_IDS` | Erlaubte User-IDs (komma-separiert) | `6377811171,987654` |
| `OUTBOUND_MODE` | Zielsystem | `sheets`, `trello`, `opusflow` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Google Spreadsheet-ID | Aus Spreadsheet-URL |
| `GOOGLE_SHEETS_WORKSHEET_NAME` | Worksheet für Transaktionen | `Transaktionen` (Default) |
| `GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME` | Worksheet für Lagerbestand | `Lagerbestand` (Default) |
| `GOOGLE_SHEETS_ALERT_THRESHOLD` | Meldebestand-Schwelle | Optional (z.B. `10`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service Account Credentials | Base64, JSON-String oder Dateipfad |
| `PORT` | Server-Port | `3000` |
| `LOG_LEVEL` | Log-Level (pino) | `info`, `debug`, `warn`, `error` |
| `NODE_ENV` | Umgebung | `development`, `production` |

## API-Endpunkte

- `POST /webhook` - Telegram Webhook
- `GET /health` - Health-Check (inkl. Cache-Status)
- `GET /webhook/info` - Webhook-Info (Status, URL, Pending Updates)

## CI/CD

GitHub Action für Lint + Tests (siehe `.github/workflows/ci.yml`).

## Google Sheets Integration

Die Google Sheets Integration ist vollständig implementiert! Siehe [docs/SHEETS_SETUP.md](docs/SHEETS_SETUP.md) für die Setup-Anleitung.

**Features:**
- ✅ **Zwei separate Worksheets**: Transaktionen + Lagerbestand
- ✅ **Lagerbestand-Verwaltung**: Automatische Aktualisierung bei Entnahme/Rückgabe
- ✅ **Meldebestand-Prüfung**: Automatische Alerts bei niedrigem Bestand
- ✅ **Telegram-Alerts**: Separate Warnung bei Bestand unter Schwellwert
- ✅ **Service Account Authentifizierung**: Unterstützung für Base64, JSON-String oder Dateipfad
- ✅ **Automatische Header-Erstellung**: Bei beiden Worksheets
- ✅ **Bestandsprüfung**: Verhindert Entnahme bei unzureichendem Bestand

**ENV-Variablen:**
```bash
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_WORKSHEET_NAME=Transaktionen
GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME=Lagerbestand
GOOGLE_SHEETS_ALERT_THRESHOLD=10  # Optional
GOOGLE_SERVICE_ACCOUNT_KEY=... # Base64, JSON-String oder Dateipfad
```

## Features

### ✅ Voice Messages (Sprachnachrichten)
Der Bot unterstützt vollständig **Sprachnachrichten**:
- ✅ Automatische Transkription mit OpenAI Whisper
- ✅ Unterstützung für forwarded messages
- ✅ Leere Transkriptionen werden erkannt
- ✅ Detailliertes Logging

Siehe [docs/VOICE_MESSAGES.md](docs/VOICE_MESSAGES.md) für Details.

## Troubleshooting

### Bot reagiert nicht?

**Schnell-Diagnose:**
```bash
pnpm diagnose
```

**Automatischer Quick-Fix:**
```bash
pnpm quick-fix
```

**Manuelle Fixes:**
- Pending Updates löschen: `pnpm clear-pending`
- Webhook-Status prüfen: `pnpm check-webhook`
- Webhook neu setzen: `pnpm setup-webhook <url>`

**Häufige Probleme:**
- **503 Service Unavailable**: Tunnel läuft nicht → `lt --port 3000 --subdomain warenentnahme-bot`
- **Pending Updates > 0**: Alte Updates warten → `pnpm clear-pending`
- **Server nicht erreichbar**: Server läuft nicht → `pnpm dev`

Siehe [docs/BOT_TROUBLESHOOTING.md](docs/BOT_TROUBLESHOOTING.md) für detaillierte Anleitung.

### Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `pnpm diagnose` | Vollständige Diagnose (ENV, Server, Tunnel, Webhook) |
| `pnpm quick-fix` | Automatischer Fix für häufige Probleme |
| `pnpm clear-pending` | Löscht pending Telegram Updates |
| `pnpm check-webhook` | Zeigt Webhook-Status und Fehler |
| `pnpm setup-webhook <url>` | Setzt Webhook-URL |
| `pnpm delete-webhook` | Löscht Webhook komplett |
| `pnpm start-tunnel` | Startet Tunnel automatisch (localtunnel/ngrok) |
| `pnpm watchdog` | Überwacht System kontinuierlich (alle 30s) |
| `pnpm auto-setup` | Richtet alles automatisch ein (Setup-Wizard) |
| `pnpm monitor-voice` | Prüft Voice Message Konfiguration |

## Deployment

Für **dauerhaften Betrieb** (24/7 ohne Laptop):

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für vollständigen Guide.

**Empfohlene Optionen:**
- 🚀 **Railway** (einfach, kostenloser Start)
- ☁️ **Render** (kostenloser Tier)
- 🐳 **Fly.io** (gut für Node.js)
- 💻 **VPS** (mehr Kontrolle, ab €4/Monat)

**Kosten:** Meist $0-10/Monat

## TODO

- [ ] Trello-Adapter: Trello API-Integration
- [ ] OpusFlow-Adapter: OpusFlow API-Integration
- [ ] Idempotenz-Cache: SQLite/Persistent Storage
- [ ] Rate-Limiting

## License

MIT

