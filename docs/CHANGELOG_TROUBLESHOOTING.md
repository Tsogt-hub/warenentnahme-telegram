# Changelog - Troubleshooting-Tools

## Neue Features (2025-11-04)

### 🔍 Diagnose-Tools

#### `pnpm diagnose`
Vollständige Systemdiagnose mit 5 Prüfungen:
1. ✅ ENV-Variablen (Token, API-Keys, Chat/User-IDs)
2. ✅ Telegram Webhook-Status (URL, Pending Updates, Fehler)
3. ✅ Server-Erreichbarkeit (Health-Check, Cache-Status)
4. ✅ Tunnel-Status (localtunnel/ngrok Prozess)
5. ✅ Webhook-Info-Endpoint (optional)

**Ausgabe zeigt:**
- Alle Probleme auf einen Blick
- Konkrete Lösungsvorschläge
- Nächste Schritte

#### `pnpm quick-fix`
Automatischer Fix für häufige Probleme:
- ✅ Löscht pending Updates automatisch
- ✅ Setzt Webhook neu
- ✅ Prüft Server-Status
- ✅ Gibt konkrete nächste Schritte

#### `pnpm clear-pending`
Löscht blockierende Telegram Updates:
- Entfernt pending Updates
- Setzt Webhook automatisch neu
- Verhindert doppelte Verarbeitung

### 📋 Verbesserte Diagnose

**Vorher:**
- Nur Webhook-Status prüfbar
- Manuelles Troubleshooting erforderlich
- Keine automatischen Fixes

**Jetzt:**
- ✅ Vollständige Systemdiagnose
- ✅ Automatische Problem-Erkennung
- ✅ Konkrete Lösungsvorschläge
- ✅ Automatische Fixes möglich

### 🚀 Neue Scripts

| Script | Funktion |
|--------|----------|
| `diagnose-bot.ts` | Vollständige Diagnose |
| `quick-fix.ts` | Automatischer Fix |
| `clear-pending-updates.ts` | Pending Updates löschen |
| `start-all.ts` | Tunnel automatisch starten |

### 📚 Dokumentation

- `docs/BOT_TROUBLESHOOTING.md` - Detaillierte Troubleshooting-Anleitung
- `docs/QUICK_FIX_GUIDE.md` - Quick-Fix-Guide mit allen Commands
- `README.md` - Troubleshooting-Abschnitt erweitert

### 🎯 Verwendung

**Schnell-Diagnose:**
```bash
pnpm diagnose
```

**Automatischer Fix:**
```bash
pnpm quick-fix
```

**Manuelle Fixes:**
```bash
pnpm clear-pending      # Pending Updates löschen
pnpm check-webhook      # Webhook-Status prüfen
pnpm setup-webhook <url> # Webhook setzen
```

### 💡 Vorteile

1. **Zeitersparnis**: Probleme werden sofort erkannt
2. **Einfacheres Debugging**: Alle Infos auf einen Blick
3. **Automatische Fixes**: Viele Probleme werden automatisch behoben
4. **Bessere Dokumentation**: Klare Anleitungen für alle Probleme


