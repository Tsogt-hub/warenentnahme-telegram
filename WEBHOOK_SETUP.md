# Webhook Setup - WICHTIG!

## Das Problem

**Der Server läuft, aber Telegram weiß nicht, wohin es Nachrichten senden soll!**

Telegram sendet Nachrichten nur an eine **Webhook-URL**. Diese muss gesetzt werden.

## Lösung: Webhook setzen

### Schritt 1: Öffentliche URL erstellen (für lokale Entwicklung)

Du brauchst eine öffentliche HTTPS-URL, die auf deinen lokalen Server zeigt.

**Option A: ngrok (Empfohlen für Tests)**

```bash
# Terminal 2: ngrok installieren (falls nicht vorhanden)
brew install ngrok

# Terminal 2: ngrok starten
ngrok http 3000
```

Du siehst dann:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Kopiere die HTTPS-URL** (z.B. `https://abc123.ngrok.io`)

**Option B: Cloudflare Tunnel, LocalTunnel, etc.**
- Oder verwende einen anderen Tunnel-Service

### Schritt 2: Webhook setzen

```bash
# Terminal 3: Webhook konfigurieren
cd /Users/tsogtnandin-erdene/warenentnahme-telegram
pnpm setup-webhook https://abc123.ngrok.io/webhook
```

**Erwartete Ausgabe:**
```
✅ Webhook erfolgreich gesetzt
   URL: https://abc123.ngrok.io/webhook
```

### Schritt 3: Webhook-Status prüfen

```bash
pnpm check-webhook
```

Sollte zeigen:
```
URL: https://abc123.ngrok.io/webhook
Pending Updates: 0
✅ Keine Fehler
```

## WICHTIG: ngrok muss laufen!

- **ngrok** muss laufen, solange du testest
- Wenn ngrok beendet wird, funktioniert der Webhook nicht mehr
- Für Production: Verwende eine dauerhafte URL

## Testen

Nach Webhook-Setup:

1. **Sende Nachricht in Telegram-Gruppe:**
   ```
   nimm 3x M8-Schrauben aus Regal A3
   ```

2. **Prüfe Server-Terminal:**
   - Sollte Logs zeigen
   - Keine Fehler

3. **Bot sollte antworten** in der Gruppe

4. **Google Sheets:** Neue Zeile sollte erscheinen

## Troubleshooting

### "Webhook nicht gesetzt"
→ `pnpm setup-webhook <url>` ausführen

### "404 Not Found" beim check-webhook
→ Bot Token falsch oder Bot existiert nicht

### Bot antwortet nicht
→ Prüfe ob ngrok läuft
→ Prüfe Webhook-URL in Telegram: `pnpm check-webhook`

### "Pending Updates" > 0
→ Alte Nachrichten werden nachgesendet (gut!)

