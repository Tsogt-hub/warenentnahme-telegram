# Webhook 404 Fix - Route nicht gefunden

## Problem

Der Webhook-Endpoint gibt **404 Not Found** zurück:
```
Wrong response from the webhook: 404 Not Found
```

## Ursachen

1. **Server läuft mit altem Code**
   - Änderungen wurden nicht übernommen
   - Server muss neu gestartet werden

2. **Route nicht registriert**
   - Code-Kompilierung fehlgeschlagen
   - Routing-Problem

## Lösung

### Schritt 1: Server neu starten

**Option A: Manuell**
```bash
# 1. Stoppe Server (Ctrl+C im Server-Terminal)
# 2. Starte neu:
pnpm dev
```

**Option B: Mit Script**
```bash
bash scripts/restart-server.sh
# Dann manuell starten: pnpm dev
```

### Schritt 2: Prüfe ob Route funktioniert

```bash
# Teste direkt
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"message_id": 1, "date": 1234567890, "chat": {"id": 1, "type": "private"}}}'

# Sollte nicht 404 zurückgeben
```

### Schritt 3: Prüfe Build

```bash
# Stelle sicher dass Code kompiliert ist
pnpm build

# Prüfe ob dist/ existiert
ls -la dist/routes/telegram.js
```

### Schritt 4: Prüfe Logs

```bash
# Starte mit Debug-Logs
LOG_LEVEL=debug pnpm dev

# Suche nach:
# - "Server läuft"
# - "Webhook empfangen"
```

## Verifikation

Nach Neustart sollte funktionieren:

```bash
# 1. Health Check
curl http://localhost:3000/health
# Sollte: {"ok": true, ...}

# 2. Webhook Test
pnpm tsx scripts/test-webhook-direct.ts
# Sollte: Status 200, nicht 404

# 3. Webhook Status
pnpm check-webhook
# Sollte: Keine Fehler
```

## Häufige Probleme

### Problem: "Route not found"
→ **Server läuft mit altem Code** → Neu starten

### Problem: "404" von Telegram
→ **Tunnel läuft nicht** → `lt --port 3000 --subdomain warenentnahme-bot`

### Problem: Server startet nicht
→ **Port bereits belegt** → Anderen Prozess beenden oder Port ändern

## Checkliste

- [ ] Server neu gestartet
- [ ] Build erfolgreich (`pnpm build`)
- [ ] Health Check funktioniert (`curl http://localhost:3000/health`)
- [ ] Webhook Test funktioniert (`pnpm tsx scripts/test-webhook-direct.ts`)
- [ ] Tunnel läuft
- [ ] Webhook gesetzt (`pnpm check-webhook`)


