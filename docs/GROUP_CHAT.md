# Telegram Gruppen-Chat Funktionalität

## ✅ Bereits konfiguriert

Die Gruppen-ID ist bereits in `.env` hinterlegt:
```bash
ALLOWED_CHAT_IDS=-5025798709
```

**Hinweis:** Negative Chat-IDs in Telegram = Gruppen/Supergruppen

## 🔧 Funktionsweise

### Mehrere Mitarbeiter in einer Gruppe

1. **Jede Nachricht wird einzeln verarbeitet:**
   - Mitarbeiter A schreibt: "nimm 5x Schrauben"
   - Mitarbeiter B schreibt: "entnimm 3 Rollen Kabel"
   - → Beide werden separat geparst und ins Sheet geschrieben

2. **Automatische Bestandsverwaltung:**
   - Jede Entnahme reduziert den Bestand
   - Jede Rückgabe erhöht den Bestand
   - Bestand wird nach jeder Nachricht aktualisiert

3. **Duplikat-Schutz:**
   - Jede Nachricht hat eine eindeutige ID (chat_id + message_id)
   - Verhindert doppelte Verarbeitung bei Wiederholungen

4. **Alle Gruppenmitglieder:**
   - Wenn Chat-ID erlaubt ist → Alle Mitglieder der Gruppe können schreiben
   - Keine separate User-ID-Prüfung für Gruppen-Chats

## 📝 Beispiel-Workflow in Gruppe

**Gruppe: "Lagerbewegungen" (ID: -5025798709)**

```
Mitarbeiter A: "nimm 5x M8-Schrauben aus Regal A3"
→ Bot: "✓ Entnahme: 5 Stk M8-Schrauben (SKU ...) aus Regal A3"
→ Sheet: Neue Zeile in "Transaktionen", Bestand reduziert

Mitarbeiter B: "entnimm 2 Rollen Kabel Lager: Kabelwand A"
→ Bot: "✓ Entnahme: 2 rolle Kabel (...) aus Kabelwand A"
→ Sheet: Neue Zeile in "Transaktionen", Bestand reduziert

Mitarbeiter C: "zurück 1x Akkuschrauber Kiste B2"
→ Bot: "✓ Eingang: 1 Stk Akkuschrauber (...) → Kiste B2"
→ Sheet: Neue Zeile, Bestand erhöht
```

## 🔄 Mehrere Nachrichten gleichzeitig

Das System verarbeitet:
- ✅ **Jede Nachricht einzeln** (keine Batch-Verarbeitung)
- ✅ **Parallel möglich** (jede Request-ID ist eindeutig)
- ✅ **Idempotenz** (gleiche Nachricht wird nur einmal verarbeitet)

## 🔧 Gruppen-ID ändern

Falls du eine andere Gruppe verwenden möchtest:

1. **Gruppen-ID herausfinden:**
   - Bot zur Gruppe hinzufügen
   - Eine Test-Nachricht senden
   - In Logs oder Webhook-Info prüfen: `chat_id` (wird negativ sein)

2. **In `.env` aktualisieren:**
   ```bash
   ALLOWED_CHAT_IDS=-123456789  # Neue Gruppen-ID
   ```

3. **Mehrere Gruppen erlauben:**
   ```bash
   ALLOWED_CHAT_IDS=-5025798709,-123456789,-987654321
   ```

## ⚙️ Konfiguration

### Aktuelle Einstellung (Gruppen-Modus)

```bash
ALLOWED_CHAT_IDS=-5025798709  # Gruppen-ID
ALLOWED_USER_IDS=6377811171   # Optional (wird in Gruppen ignoriert)
```

**Verhalten:**
- Alle Mitglieder der Gruppe `-5025798709` können schreiben
- Jede Nachricht wird verarbeitet
- User-ID-Prüfung wird übersprungen für Gruppen

### Privat-Chat + Gruppe kombinieren

```bash
ALLOWED_CHAT_IDS=-5025798709,123456789  # Gruppe + Privat
ALLOWED_USER_IDS=6377811171,987654321   # Erlaubte User-IDs für Privat-Chats
```

## 📊 Logging

Alle Nachrichten werden geloggt mit:
- `chat_id`: Gruppen-ID (negativ)
- `telegram_user_id`: ID des schreibenden Mitarbeiters
- `telegram_username`: Username (falls vorhanden)
- `request_id`: Eindeutige ID für Duplikat-Check

## ✅ Testen

1. **Bot zur Gruppe hinzufügen:**
   - Bot in Telegram suchen
   - Zur Gruppe `-5025798709` hinzufügen

2. **Test-Nachricht senden:**
   ```
   nimm 3x Test-Artikel aus Regal A1
   ```

3. **Prüfe:**
   - Bot antwortet mit Bestätigung
   - Google Sheets: Neue Zeile in "Transaktionen"
   - Google Sheets: Bestand in "Lagerbestand" aktualisiert

## 🚨 Wichtige Hinweise

- **Bot muss Admin-Rechte haben?** Nein, nur Mitglied reicht
- **Alle Mitglieder können schreiben?** Ja, wenn Chat-ID erlaubt ist
- **Was passiert bei unbekannten Chat-IDs?** Nachricht wird abgelehnt
- **Können mehrere Gruppen gleichzeitig verwendet werden?** Ja, komma-separiert in `ALLOWED_CHAT_IDS`

