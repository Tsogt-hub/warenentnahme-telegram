# Retry-Logik mit Exponential Backoff

## ✅ Implementiert

Das System verwendet jetzt **Retry-Logik mit Exponential Backoff** für:

1. **OpenAI Whisper Transkription**
   - 3 Retries
   - Exponential Backoff: 2s, 4s, 8s
   - Max Delay: 30s

2. **Telegram File Download**
   - 3 Retries
   - Exponential Backoff: 1s, 2s, 4s
   - Max Delay: 10s

## 🔧 Funktionsweise

### Exponential Backoff

Bei jedem Retry wird die Wartezeit verdoppelt:

```
Retry 1: 2 Sekunden warten
Retry 2: 4 Sekunden warten
Retry 3: 8 Sekunden warten
```

Maximaler Delay: 30 Sekunden (verhindert zu lange Wartezeiten)

### Retryable Errors

Retries werden nur bei folgenden Fehlern durchgeführt:

- `timeout` - Request Timeout
- `ECONNRESET` - Verbindung zurückgesetzt
- `ETIMEDOUT` - Timeout
- `ENOTFOUND` - DNS-Fehler
- `429` - Rate Limit
- `503` - Service Unavailable
- `502` - Bad Gateway

Andere Fehler (z.B. `401 Unauthorized`) werden **nicht** retried.

## 📊 Logging

Bei jedem Retry wird geloggt:

```
[WARN] Retry 1/3 nach 2000ms
  error: "timeout"
  attempt: 1
  delay: 2000
```

## 🎯 Vorteile

1. **Robustheit**: Automatische Retries bei temporären Fehlern
2. **Performance**: Exponential Backoff verhindert Server-Overload
3. **Transparenz**: Logging zeigt alle Retries
4. **Intelligenz**: Nur retryable Fehler werden retried

## 💡 Beispiel

### Vorher (ohne Retry)
```
Request → Timeout → Fehler ❌
```

### Jetzt (mit Retry)
```
Request → Timeout
Wait 2s → Retry → Timeout
Wait 4s → Retry → Erfolg ✅
```

## 🔧 Konfiguration

Die Retry-Logik kann in `src/utils/retry.ts` angepasst werden:

```typescript
{
  maxRetries: 3,        // Anzahl Retries
  initialDelay: 2000,   // Erster Delay (ms)
  maxDelay: 30000,      // Maximaler Delay (ms)
  backoffMultiplier: 2, // Multiplikator (2 = verdoppeln)
}
```

## 📝 Verwendung

Die Retry-Logik wird automatisch verwendet bei:

- `transcribeVoiceMessage()` - Whisper API Calls
- `downloadTelegramFile()` - Telegram File Downloads

Keine zusätzliche Konfiguration nötig!


