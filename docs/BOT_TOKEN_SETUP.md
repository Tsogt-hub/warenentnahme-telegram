# Bot Token Setup

## Bot Token bekommen

### Option 1: Neuen Bot erstellen

1. Öffne Telegram
2. Suche nach `@BotFather`
3. Sende `/newbot`
4. Folge den Anweisungen:
   - Bot-Name wählen
   - Username wählen (muss auf `bot` enden, z.B. `mein_lager_bot`)
5. BotFather gibt dir einen Token, z.B.:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
   ```

### Option 2: Existierenden Bot verwenden

1. Öffne Telegram
2. Suche nach `@BotFather`
3. Sende `/mybots`
4. Wähle deinen Bot
5. Klicke auf "API Token"
6. Kopiere den Token

## Token in .env eintragen

1. Öffne `.env` Datei im Projekt
2. Finde die Zeile:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```
3. Ersetze mit deinem echten Token:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
   ```
4. **Speichere die Datei!**
5. Server neu starten

## Token prüfen

```bash
pnpm check-webhook
```

Sollte zeigen: Bot-Name und Details

## Bot zur Gruppe hinzufügen

1. Öffne deine Telegram-Gruppe
2. Klicke auf Gruppen-Name (oben)
3. Klicke auf "Mitglieder hinzufügen"
4. Suche nach deinem Bot (z.B. `@mein_lager_bot`)
5. Bot zur Gruppe hinzufügen

## Wichtig

- Token niemals in Git committen!
- Token ist geheim - nicht teilen
- Token in `.env` (nicht `.env.example`)

