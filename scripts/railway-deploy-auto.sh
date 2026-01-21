#!/bin/bash
# Deployt Code zu Railway - automatisch Service finden/erstellen
#
# Voraussetzung:
#   - railway login bereits durchgeführt
#   - Projekt bereits verlinkt

cd "$(dirname "$0")/.." || exit 1

echo "🚀 Railway Auto-Deployment"
echo ""

# Prüfe Login
if ! railway whoami &> /dev/null; then
    echo "❌ Nicht eingeloggt"
    echo "   Führe aus: railway login --browserless"
    exit 1
fi

echo "✅ Eingeloggt als: $(railway whoami)"
echo ""

# Prüfe ob Projekt verlinkt
if ! railway status &> /dev/null; then
    echo "❌ Projekt nicht verlinkt"
    echo "   Führe aus: railway link"
    exit 1
fi

echo "✅ Projekt verlinkt"
echo ""

# Versuche Service zu finden/erstellen
echo "🔍 Prüfe Services..."
SERVICE_NAME="warenentnahme-bot"

# Versuche verschiedene Service-Namen
for name in "warenentnahme-bot" "telegram-bot" "app" "web" "api"; do
    if railway service "$name" &> /dev/null; then
        SERVICE_NAME="$name"
        echo "✅ Service gefunden: $SERVICE_NAME"
        break
    fi
done

# Falls kein Service gefunden, versuche railway up direkt
# Railway erstellt automatisch einen Service wenn nötig
echo ""
echo "📤 Deploye Code..."
echo "   (Railway erstellt automatisch Service falls nötig)"
echo ""

# Versuche mit verschiedenen Optionen
railway up --service "$SERVICE_NAME" 2>&1 || \
railway up 2>&1 || {
    echo ""
    echo "⚠️  Multiple Services gefunden"
    echo ""
    echo "📋 Lösung:"
    echo "   1. Railway Dashboard öffnen"
    echo "   2. Projekt: prolific-dedication"
    echo "   3. Klicke auf einen bestehenden Service"
    echo "   4. Oder: Erstelle neuen Service"
    echo "   5. Dann: railway service <service-name>"
    echo "   6. Dann: railway up"
    echo ""
    exit 1
}

echo ""
echo "✅ Deployment gestartet!"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. Railway Dashboard → Variables → ENV-Variablen setzen"
echo "   2. Warte auf Deployment-URL"
echo "   3. Webhook setzen: pnpm setup-webhook <URL>/webhook"
echo ""

