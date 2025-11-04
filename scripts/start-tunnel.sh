#!/bin/bash
# Startet localtunnel für den Bot
# Falls localtunnel nicht installiert ist, wird ngrok verwendet

PORT=${1:-3000}
WEBHOOK_URL=""

echo "🔗 Starte Tunnel für Port $PORT..."

# Prüfe ob localtunnel installiert ist
if command -v lt &> /dev/null; then
    echo "✅ localtunnel gefunden"
    echo "📡 Starte localtunnel auf Port $PORT..."
    echo "💡 Verwende: lt --port $PORT --subdomain warenentnahme-bot"
    lt --port $PORT --subdomain warenentnahme-bot &
    TUNNEL_PID=$!
    sleep 3
    WEBHOOK_URL="https://warenentnahme-bot.loca.lt/webhook"
elif command -v ngrok &> /dev/null; then
    echo "✅ ngrok gefunden"
    echo "📡 Starte ngrok auf Port $PORT..."
    ngrok http $PORT &
    TUNNEL_PID=$!
    sleep 3
    # Ngrok URL wird dynamisch generiert
    echo "⚠️  ngrok URL muss manuell aus ngrok-Interface kopiert werden"
    echo "💡 Öffne: http://localhost:4040"
else
    echo "❌ Weder localtunnel noch ngrok gefunden"
    echo ""
    echo "💡 Installation:"
    echo "   localtunnel: npm install -g localtunnel"
    echo "   ngrok: brew install ngrok"
    exit 1
fi

echo ""
echo "✅ Tunnel gestartet (PID: $TUNNEL_PID)"
echo "📋 Webhook-URL: $WEBHOOK_URL"
echo ""
echo "💡 Webhook setzen mit:"
if [ -n "$WEBHOOK_URL" ]; then
    echo "   pnpm setup-webhook $WEBHOOK_URL"
else
    echo "   pnpm setup-webhook <url-von-ngrok>"
fi
echo ""
echo "⚠️  Tunnel läuft im Hintergrund. Zum Beenden: kill $TUNNEL_PID"


