#!/bin/bash
# Startet Server neu
# 
# Usage:
#   bash scripts/restart-server.sh

cd "$(dirname "$0")/.." || exit 1

echo "🔄 Starte Server neu..."
echo ""

# Finde laufenden Server-Prozess
SERVER_PID=$(ps aux | grep -E "tsx.*index|node.*index" | grep -v grep | grep warenentnahme | awk '{print $2}' | head -1)

if [ -n "$SERVER_PID" ]; then
    echo "📡 Stoppe Server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null
    sleep 2
    
    # Prüfe ob noch läuft
    if ps -p "$SERVER_PID" > /dev/null 2>&1; then
        echo "⚠️  Server läuft noch, force kill..."
        kill -9 "$SERVER_PID" 2>/dev/null
    fi
    echo "✅ Server gestoppt"
else
    echo "ℹ️  Kein Server-Prozess gefunden"
fi

echo ""
echo "🚀 Starte Server neu..."
echo "💡 Tipp: Für Debug-Logs: LOG_LEVEL=debug pnpm dev"
echo ""
echo "⚠️  Bitte starte Server manuell in neuem Terminal:"
echo "   pnpm dev"
echo ""
echo "Oder für Debug-Logs:"
echo "   LOG_LEVEL=debug pnpm dev"


