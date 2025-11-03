# 🚀 Start-Anleitung - Schritt für Schritt

## Was ist der "Server"?

Der **Server** ist dein Telegram-Bot-Programm, das:
- Auf Telegram-Nachrichten wartet (via Webhook)
- Diese mit Claude AI parst
- In Google Sheets schreibt

## Schritt 1: Terminal öffnen

Öffne ein Terminal-Fenster auf deinem Mac.

## Schritt 2: Ins Projekt-Verzeichnis wechseln

```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram
```

## Schritt 3: Server starten

**Option A: Development (mit Auto-Reload)**
```bash
pnpm dev
```

**Option B: Mit Debug-Logging (empfohlen zum Testen)**
```bash
LOG_LEVEL=debug pnpm dev
```

**Was du sehen solltest:**
```
Server startet
Server läuft auf http://localhost:3000
```

**⚠️ WICHTIG:** Lasse dieses Terminal-Fenster geöffnet! Der Server muss laufen.

## Schritt 4: Webhook konfigurieren

Öffne ein **zweites Terminal-Fenster** (Cmd+T für neues Tab):

```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram
```

### Für lokale Entwicklung (mit ngrok):

**Terminal 2: ngrok installieren (falls noch nicht vorhanden)**
```bash
# Prüfe ob ngrok installiert ist:
ngrok --version

# Falls nicht: Installiere mit Homebrew
brew install ngrok
```

**Terminal 2: ngrok starten**
```bash
ngrok http 3000
```

**Was du sehen solltest:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Kopiere die HTTPS-URL** (z.B. `https://abc123.ngrok.io`)

**Terminal 3 (oder weiter im Terminal 2): Webhook setzen**
```bash
cd /Users/tsogtnandin-erdene/warenentnahme-telegram
pnpm setup-webhook https://abc123.ngrok.io/webhook
```

**Erwartete Ausgabe:**
```
✅ Webhook erfolgreich gesetzt
   URL: https://abc123.ngrok.io/webhook
```

## Schritt 5: Testen

1. **Öffne Telegram** auf deinem Handy/Computer
2. **Gehe zur Gruppe** (ID: -5025798709)
3. **Stelle sicher, dass der Bot in der Gruppe ist**
4. **Sende Test-Nachricht:**
   ```
   nimm 3x M8-Schrauben aus Regal A3
   ```

5. **Prüfe Server-Terminal (Terminal 1):**
   - Du solltest Logs sehen wie:
     ```
     [INFO] Telegram Update empfangen
     [INFO] Claude parse successful
     [INFO] Sheets adapter: Zeile erfolgreich hinzugefügt
     ```

6. **Bot sollte antworten** in der Telegram-Gruppe mit Bestätigung

7. **Prüfe Google Sheets:**
   - Öffne: https://docs.google.com/spreadsheets/d/1J20eQXiQPZHuR-ftBMscf1pGg5aLLkbpl3M0yi1gNpc/edit
   - Worksheet "Transaktionen" → Neue Zeile sollte erscheinen

## Was wenn es nicht funktioniert?

### Problem: "Server läuft" aber keine Antwort vom Bot

**Lösung:**
1. Prüfe ob Webhook gesetzt ist:
   ```bash
   curl http://localhost:3000/webhook/info
   ```

2. Prüfe Logs im Server-Terminal für Fehler

### Problem: "Permission denied" oder Sheets-Fehler

**Lösung:**
- Stelle sicher, dass Spreadsheet mit `sheets-connector@warenlager.iam.gserviceaccount.com` geteilt wurde
- Prüfe mit: `pnpm test-sheets`

### Problem: Bot antwortet nicht

**Prüfe:**
1. Bot ist in der Gruppe? → Füge Bot zur Gruppe hinzu
2. Server-Terminal zeigt Logs? → Wenn nicht, Webhook nicht gesetzt
3. Gruppen-ID korrekt? → Prüfe `ALLOWED_CHAT_IDS` in `.env`

## 📋 Checkliste

- [ ] Terminal 1: Server läuft (`pnpm dev`)
- [ ] Terminal 2: ngrok läuft (`ngrok http 3000`)
- [ ] Terminal 3: Webhook gesetzt (`pnpm setup-webhook <url>`)
- [ ] Bot ist Mitglied der Telegram-Gruppe
- [ ] Test-Nachricht gesendet
- [ ] Logs im Server-Terminal sichtbar
- [ ] Bot hat geantwortet
- [ ] Zeile in Google Sheets erschienen

## 🛑 Server stoppen

Wenn du fertig bist oder neu starten musst:

- **Im Server-Terminal:** Drücke `Ctrl+C` (oder `Cmd+C` auf Mac)
- **ngrok läuft weiter** - auch mit `Ctrl+C` stoppen

---

**Zusammenfassung:** Der "Server" ist einfach dein laufendes Programm. Starte es mit `pnpm dev` und lasse es laufen! 🚀

