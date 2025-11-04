#!/bin/bash
# Startet Bot-Service komplett
# 
# Usage:
#   ./scripts/start-bot.sh
#   oder
#   bash scripts/start-bot.sh

cd "$(dirname "$0")/.." || exit 1

echo "🚀 Starte Bot-Service..."
echo "=" | head -c 60 && echo ""

# 1. Prüfe ENV-Variablen
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN fehlt"
    echo "💡 Bitte .env-Datei prüfen"
    exit 1
fi

# 2. Prüfe ob Server läuft
echo ""
echo "1️⃣ Prüfe Server..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Server läuft bereits"
else
    echo "   ⚠️  Server läuft nicht"
    echo "   💡 Starte Server in neuem Terminal:"
    echo "      pnpm dev"
    echo ""
    read -p "   Server jetzt starten? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        echo "   📡 Starte Server im Hintergrund..."
        LOG_LEVEL=info pnpm dev > server.log 2>&1 &
        SERVER_PID=$!
        echo "   ✅ Server gestartet (PID: $SERVER_PID)"
        echo "   📋 Logs: tail -f server.log"
        sleep 3
    else
        echo "   ⚠️  Server muss manuell gestartet werden"
    fi
fi

# 3. Prüfe/Starte Tunnel
echo ""
echo "2️⃣ Prüfe Tunnel..."
if pgrep -f "lt --port" > /dev/null; then
    echo "   ✅ localtunnel läuft bereits"
    TUNNEL_URL="https://warenentnahme-bot.loca.lt/webhook"
elif pgrep -f "ngrok http" > /dev/null; then
    echo "   ✅ ngrok läuft bereits"
    echo "   💡 Bitte URL aus http://localhost:4040 kopieren"
    TUNNEL_URL=""
else
    echo "   ❌ Tunnel läuft nicht"
    
    # Prüfe ob localtunnel installiert
    if command -v lt &> /dev/null; then
        echo "   📡 Starte localtunnel..."
        lt --port 3000 --subdomain warenentnahme-bot > tunnel.log 2>&1 &
        TUNNEL_PID=$!
        echo "   ✅ Tunnel gestartet (PID: $TUNNEL_PID)"
        echo "   📋 Logs: tail -f tunnel.log"
        sleep 5
        TUNNEL_URL="https://warenentnahme-bot.loca.lt/webhook"
    elif command -v ngrok &> /dev/null; then
        echo "   📡 Starte ngrok..."
        ngrok http 3000 > tunnel.log 2>&1 &
        TUNNEL_PID=$!
        echo "   ✅ Tunnel gestartet (PID: $TUNNEL_PID)"
        echo "   💡 Bitte URL aus http://localhost:4040 kopieren"
        TUNNEL_URL=""
    else
        echo "   ❌ Kein Tunnel-Tool gefunden"
        echo "   💡 Installation:"
        echo "      localtunnel: npm install -g localtunnel"
        echo "      ngrok: brew install ngrok"
        TUNNEL_URL=""
    fi
fi

# 4. Webhook setzen
if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo "3️⃣ Setze Webhook..."
    pnpm setup-webhook "$TUNNEL_URL" 2>&1 | grep -E "✅|❌|URL:"
fi

# 5. Finale Diagnose
echo ""
echo "4️⃣ Finale Diagnose..."
pnpm diagnose

echo ""
echo "=" | head -c 60 && echo ""
echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📋 Service-Status:"
echo "   Server: $(curl -s http://localhost:3000/health > /dev/null 2>&1 && echo '✅ Läuft' || echo '❌ Läuft nicht')"
echo "   Tunnel: $(pgrep -f "lt --port\|ngrok http" > /dev/null && echo '✅ Läuft' || echo '❌ Läuft nicht')"
echo ""
echo "💡 Nächste Schritte:"
echo "   1. Sende Test-Nachricht in Telegram-Gruppe"
echo "   2. Für Monitoring: pnpm watchdog"
echo "   3. Für Logs: tail -f server.log"


