# Voice Messages - Sprachnachrichten

## ✅ Unterstützung

Der Bot unterstützt **Sprachnachrichten** vollständig:

1. **Erkennung**: Bot erkennt Voice Messages automatisch
2. **Transkription**: OpenAI Whisper transkribiert zu Text
3. **Verarbeitung**: Text wird normal geparst und verarbeitet
4. **Antwort**: Bot sendet Bestätigung und verarbeitete Transaktion

## 🎤 Funktionsweise

### Workflow

1. **Sprachnachricht empfangen**
   - Bot erkennt `voice` im Telegram Update
   - Loggt: "Voice Message empfangen"

2. **Transkription**
   - Bot lädt Audio-Datei von Telegram herunter
   - Sendet an OpenAI Whisper API
   - Erhält transkribierten Text

3. **Zwischennachricht**
   - Bot sendet: "🎤 Sprachnachricht transkribiert: ..."
   - Zeigt User was transkribiert wurde

4. **Verarbeitung**
   - Text wird normal verarbeitet (wie bei Text-Nachrichten)
   - LLM parst die Transaktion
   - Schreibt in Sheets/Trello/OpusFlow

5. **Finale Antwort**
   - Bot sendet Bestätigung (z.B. "✓ Entnahme: 3 Stk...")

## 📋 Voraussetzungen

### ENV-Variablen

```bash
OPENAI_API_KEY=sk-...  # Benötigt für Whisper Transkription
```

**Wichtig**: `OPENAI_API_KEY` ist **erforderlich** für Voice Messages. Claude API unterstützt keine Audio-Verarbeitung.

### Kosten

- OpenAI Whisper: ~$0.006 pro Minute Audio
- Sehr günstig für Sprachnachrichten

## 🔧 Features

### ✅ Unterstützt

- ✅ Normale Sprachnachrichten
- ✅ Weitergeleitete Sprachnachrichten (forwarded messages)
- ✅ Automatische Transkription (Deutsch)
- ✅ Leere Transkriptionen werden erkannt
- ✅ Fehlerbehandlung bei Transkriptionsfehlern

### ❌ Nicht unterstützt

- ❌ Audio-Dateien (nur Voice Messages)
- ❌ Andere Sprachen (aktuell nur Deutsch)
- ❌ Video Messages

## 🐛 Troubleshooting

### Problem: Bot reagiert nicht auf Sprachnachricht

**Prüfe:**

1. **Server-Logs**
   ```bash
   LOG_LEVEL=debug pnpm dev
   ```
   Suche nach:
   - "Voice Message empfangen"
   - "Transkription fehlgeschlagen"
   - "Keine Text- oder Voice-Nachricht"

2. **ENV-Variablen**
   ```bash
   echo $OPENAI_API_KEY
   ```
   Muss gesetzt sein!

3. **Webhook-Status**
   ```bash
   pnpm check-webhook
   ```

4. **Forwarded Messages**
   - Weitergeleitete Nachrichten werden unterstützt
   - Logs zeigen `isForwarded: true`

### Problem: "Transkription fehlgeschlagen"

**Mögliche Ursachen:**

1. **OPENAI_API_KEY fehlt**
   ```bash
   # Prüfe .env
   OPENAI_API_KEY=sk-...
   ```

2. **Audio-Datei zu groß**
   - Whisper hat Limit von 25MB
   - Normalerweise kein Problem bei Voice Messages

3. **Leere Audio-Datei**
   - Stille Audio-Datei wird erkannt
   - Bot sendet Fehlermeldung

4. **API-Timeout**
   - Timeout ist 60 Sekunden
   - Bei sehr langen Nachrichten möglicherweise zu kurz

### Problem: "Transkription ergab leeren Text"

- Audio war zu leise oder stumm
- Versuche es mit einer neuen Sprachnachricht
- Stelle sicher, dass du sprichst während der Aufnahme

## 📊 Logs

### Erfolgreiche Transkription

```
[INFO] Voice Message empfangen, starte Transkription
  fileId: "AwACAgIAAxk..."
  duration: 8
  fileSize: 12345

[INFO] Starte Transkription der Voice Message mit Whisper
  fileId: "AwACAgIAAxk..."

[INFO] Voice Message erfolgreich transkribiert
  textLength: 45
  preview: "nimm 3x M8-Schrauben aus Regal A3"

[INFO] Telegram Update empfangen
  hasVoice: true
  isForwarded: false
```

### Fehlerhafte Transkription

```
[ERROR] Fehler bei Transkription
  error: "Transkription fehlgeschlagen: ..."
  fileId: "AwACAgIAAxk..."
```

## 🧪 Testen

### Manueller Test

1. **Telegram öffnen**
2. **Zur Gruppe gehen**
3. **Sprachnachricht senden:**
   - Sage: "nimm 3x M8-Schrauben aus Regal A3"
4. **Bot sollte antworten:**
   - Zuerst: "🎤 Sprachnachricht transkribiert: ..."
   - Dann: "✓ Entnahme: 3 Stk M8-Schrauben..."

### Test-Script

```bash
pnpm tsx scripts/test-voice-webhook.ts
```

## 🔄 Weitergeleitete Nachrichten

Weitergeleitete Sprachnachrichten werden unterstützt:

- Schema erkennt `forward_from` und `forward_from_chat`
- Logs zeigen `isForwarded: true`
- Verarbeitung funktioniert normal

## 💡 Best Practices

1. **Klare Aussprache**: Sprich deutlich und langsam
2. **Gute Audio-Qualität**: Stelle sicher, dass Mikrofon funktioniert
3. **Kurze Nachrichten**: Längere Transkriptionen dauern länger
4. **Deutsch**: Aktuell nur Deutsch unterstützt

## 📝 Beispiel-Workflow

```
User: [Sprachnachricht: "nimm 5x Schrauben aus Regal A3"]

Bot: 🎤 Sprachnachricht transkribiert:
     "nimm 5x Schrauben aus Regal A3"
     ⏳ Verarbeite...

Bot: ✓ Entnahme: 5 Stk Schrauben (SKU ...) aus Regal A3
```

## 🔧 Technische Details

- **Transkriptions-Service**: OpenAI Whisper API
- **Modell**: `whisper-1`
- **Sprache**: Deutsch (`language: "de"`)
- **Format**: OGG (Telegram Standard)
- **Timeout**: 60 Sekunden
- **Max. Größe**: 25MB (Telegram Limit)


