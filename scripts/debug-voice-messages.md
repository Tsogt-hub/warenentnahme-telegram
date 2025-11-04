# Debug: Voice Messages werden nicht verarbeitet

## Mögliche Ursachen

1. **Webhook empfängt Message nicht**
   - Prüfe: `pnpm check-webhook`
   - Prüfe Server-Logs

2. **Voice Message wird nicht erkannt**
   - Prüfe Logs: `LOG_LEVEL=debug pnpm dev`
   - Suche nach "Voice Message empfangen"

3. **Forwarded Messages**
   - Weitergeleitete Nachrichten haben andere Struktur
   - Bot muss `forward_from` oder `forward_from_chat` unterstützen

4. **Transkription schlägt fehl**
   - Prüfe: `OPENAI_API_KEY` gesetzt?
   - Prüfe Logs auf Fehler

## Debug-Schritte

### 1. Server-Logs prüfen
```bash
# Terminal mit Server-Logs öffnen
# Suche nach:
# - "Telegram Update empfangen"
# - "Voice Message empfangen"
# - "Keine Text- oder Voice-Nachricht"
```

### 2. Webhook-Status prüfen
```bash
pnpm check-webhook
```

### 3. Manueller Test
```bash
# Teste Voice Message Webhook
pnpm tsx scripts/test-voice-webhook.ts
```

### 4. Logs mit Debug-Level
```bash
LOG_LEVEL=debug pnpm dev
```

## Was ich verbessert habe

1. ✅ Schema unterstützt jetzt `forward_from` und `forward_from_chat`
2. ✅ Logging zeigt an ob Message forwarded ist
3. ✅ Bessere Warnungen bei unbekannten Message-Typen
4. ✅ Schema erlaubt zusätzliche Felder mit `.passthrough()`

## Nächste Schritte

1. **Server neu starten** (damit Schema-Änderungen aktiv werden)
2. **Neue Sprachnachricht senden**
3. **Logs prüfen** - sollte jetzt zeigen:
   - "Telegram Update empfangen" mit `isForwarded: true/false`
   - "Voice Message empfangen" wenn Voice erkannt wird
   - Oder "Keine Text- oder Voice-Nachricht erkannt" mit Details


