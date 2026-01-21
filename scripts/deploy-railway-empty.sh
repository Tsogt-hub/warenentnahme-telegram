#!/bin/bash
# Deployt Code zu Railway Empty Project
#
# Usage:
#   bash scripts/deploy-railway-empty.sh
#
# Voraussetzung:
#   1. Empty Project in Railway Dashboard erstellt
#   2. railway login ausgeführt

cd "$(dirname "$0")/.." || exit 1

echo "🚀 Railway Empty Project Deployment"
echo ""

# Prüfe ob railway installiert
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI nicht installiert"
    echo "   Installiere: npm i -g @railway/cli"
    exit 1
fi

# Prüfe ob eingeloggt
echo "🔍 Prüfe Railway Login..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  Nicht eingeloggt"
    echo "   Führe aus: railway login"
    echo ""
    read -p "Jetzt einloggen? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        railway login
    else
        echo "❌ Abgebrochen - bitte zuerst: railway login"
        exit 1
    fi
fi

echo "✅ Eingeloggt als: $(railway whoami)"
echo ""

# Prüfe ob bereits verbunden
if [ -f ".railway/project.json" ]; then
    echo "✅ Projekt bereits verbunden"
    PROJECT_NAME=$(railway status 2>/dev/null | grep -i "project" | head -1 || echo "Unknown")
    echo "   Projekt: $PROJECT_NAME"
    echo ""
    read -p "Neu verbinden? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        railway init
    fi
else
    echo "📡 Verbinde mit Railway Projekt..."
    railway init
fi

echo ""
echo "📤 Deploye Code..."
railway up

echo ""
echo "✅ Deployment gestartet!"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. Gehe zu Railway Dashboard"
echo "   2. Setze ENV-Variablen (Variables Tab)"
echo "   3. Kopiere Deployment-URL"
echo "   4. Setze Webhook: pnpm setup-webhook <URL>/webhook"
echo ""

