#!/bin/bash
# Deployt Code zu Railway (nach Login)
#
# Voraussetzung:
#   - railway login bereits durchgeführt
#   - Empty Project in Railway Dashboard erstellt

cd "$(dirname "$0")/.." || exit 1

echo "🚀 Railway Deployment"
echo ""

# Prüfe Login
if ! railway whoami &> /dev/null; then
    echo "❌ Nicht eingeloggt"
    echo ""
    echo "📋 Bitte zuerst:"
    echo "   railway login"
    echo ""
    exit 1
fi

echo "✅ Eingeloggt als: $(railway whoami)"
echo ""

# Prüfe ob Projekt verbunden
if [ ! -f ".railway/project.json" ]; then
    echo "📡 Verbinde mit Railway Projekt..."
    railway init
    echo ""
fi

echo "📤 Deploye Code..."
railway up

echo ""
echo "✅ Deployment gestartet!"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. Railway Dashboard → Variables → ENV-Variablen setzen"
echo "   2. Warte auf Deployment-URL"
echo "   3. Webhook setzen: pnpm setup-webhook <URL>/webhook"
echo ""

