# Troubleshooting - Sheets-Integration

## Problem: Nachrichten erscheinen nicht in Google Sheets

### ✅ Schritt 1: Sheets-Verbindung testen

```bash
pnpm test-sheets
```

**Erwartetes Ergebnis:**
- ✅ "Test-Zeile erfolgreich geschrieben!"
- Prüfe Spreadsheet: Neue Zeile sollte erscheinen

**Wenn Fehler:**
- ❌ "Permission denied" → Spreadsheet nicht mit Service Account geteilt
- ❌ "Invalid credentials" → Service Account Key falsch
- ❌ "Spreadsheet not found" → Spreadsheet-ID falsch

### ✅ Schritt 2: Server-Logs prüfen

Starte Server mit Debug-Logging:

```bash
LOG_LEVEL=debug pnpm dev
```

**Was du sehen solltest bei einer Nachricht:**

```
[INFO] Telegram Update empfangen
  chatId: -5025798709
  messageId: 123
  userId: 6377811171
  text: "nimm 3x Schrauben"

[INFO] Claude parse successful
  action: "withdraw"
  item_name: "Schrauben"
  qty: 3

[INFO] Starte Outbound-Integration
  action: "withdraw"
  mode: "sheets"

[INFO] Sheets adapter: Zeile erfolgreich hinzugefügt
```

**Häufige Fehler-Meldungen:**

1. **"Outbound-Integration übersprungen"**
   - Prüfe: `authorized: false` → Authorization-Problem
   - Prüfe: `duplicate: true` → Nachricht wurde bereits verarbeitet

2. **"Outbound dispatch failed"**
   - Prüfe: Fehlermeldung im Log
   - Mögliche Ursachen: Sheets-Verbindung, fehlende Permissions

3. **"Sheets-Client nicht initialisiert"**
   - Prüfe: `GOOGLE_SHEETS_SPREADSHEET_ID` in `.env`
   - Prüfe: `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env`

### ✅ Schritt 3: Webhook-Status prüfen

```bash
# Webhook-Info abrufen
curl http://localhost:3000/webhook/info

# Oder mit Script
pnpm setup-webhook https://your-url.com/webhook
# (zeigt auch Info)
```

**Prüfe:**
- Webhook-URL korrekt?
- Pending Updates vorhanden? (dann werden sie verarbeitet)
- Letzter Fehler? (zeigt Probleme)

### ✅ Schritt 4: Manueller Test

Starte Debug-Server:

```bash
pnpm tsx scripts/debug-webhook.ts
```

Dann in anderem Terminal:

```bash
curl "http://localhost:3000/test?message=nimm%205x%20Schrauben"
```

**Erwartetes Ergebnis:**
- Server-Log zeigt Verarbeitung
- Sheets: Neue Zeile erscheint

## Häufige Probleme & Lösungen

### Problem 1: "Sheets adapter: Übersprungen"

**Ursache:** `authorized: false` oder `duplicate: true`

**Lösung:**
- Prüfe `ALLOWED_CHAT_IDS` in `.env` (muss Gruppen-ID enthalten)
- Prüfe Chat-ID ist negativ (Gruppen-Chat)
- Prüfe ob Nachricht bereits verarbeitet wurde

### Problem 2: "Permission denied"

**Ursache:** Spreadsheet nicht mit Service Account geteilt

**Lösung:**
1. Öffne Spreadsheet
2. "Teilen" klicken
3. E-Mail hinzufügen: `sheets-connector@warenlager.iam.gserviceaccount.com`
4. Berechtigung: "Bearbeiter"
5. Teilen

### Problem 3: "Spreadsheet not found"

**Ursache:** Falsche Spreadsheet-ID

**Lösung:**
- Prüfe URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`
- Kopiere ID nach `GOOGLE_SHEETS_SPREADSHEET_ID` in `.env`

### Problem 4: Webhook empfängt keine Nachrichten

**Ursache:** Webhook nicht gesetzt oder falsche URL

**Lösung:**
```bash
# Webhook setzen
pnpm setup-webhook https://your-domain.com/webhook

# Webhook löschen (falls nötig)
pnpm delete-webhook

# Dann neu setzen
```

### Problem 5: Claude API Fehler

**Ursache:** API-Key falsch oder keine Credits

**Lösung:**
- Prüfe `CLAUDE_API_KEY` in `.env`
- Prüfe API-Key in Anthropic Console
- Prüfe Account Credits

## Debug-Modi

### Verbose Logging

```bash
LOG_LEVEL=debug pnpm dev
```

### Nur Sheets-Test (ohne Telegram)

```bash
pnpm test-sheets
```

### Manueller Webhook-Test

```bash
# Terminal 1: Debug-Server
pnpm tsx scripts/debug-webhook.ts

# Terminal 2: Test-Request
curl "http://localhost:3000/test?message=nimm%205x%20Schrauben"
```

## Checkliste

- [ ] Service Account Key vorhanden: `service-account-key.json`
- [ ] Spreadsheet mit Service Account E-Mail geteilt
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` korrekt in `.env`
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY=./service-account-key.json` in `.env`
- [ ] `pnpm test-sheets` erfolgreich
- [ ] Server läuft: `pnpm dev`
- [ ] Webhook gesetzt: `pnpm setup-webhook <url>`
- [ ] Bot ist Mitglied der Gruppe
- [ ] Gruppen-ID in `ALLOWED_CHAT_IDS` korrekt
- [ ] Logs zeigen keine Fehler

## Noch Probleme?

Sammle diese Informationen:

1. **Server-Logs** (mit `LOG_LEVEL=debug`)
2. **Test-Sheets Output:** `pnpm test-sheets`
3. **Webhook-Info:** `curl http://localhost:3000/webhook/info`
4. **Health-Check:** `curl http://localhost:3000/health`

Dann können wir gezielt helfen! 🔍

