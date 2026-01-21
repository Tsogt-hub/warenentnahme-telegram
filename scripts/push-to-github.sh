#!/bin/bash
# Pusht Code zu GitHub
# 
# Usage:
#   bash scripts/push-to-github.sh
#
# Voraussetzung: Repository muss auf GitHub existieren!

cd "$(dirname "$0")/.." || exit 1

echo "🚀 Pushe Code zu GitHub..."
echo ""

# Prüfe ob Remote existiert
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "📡 Füge GitHub Remote hinzu..."
    git remote add origin https://github.com/tsogt-hub/warenentnahme-telegram.git
fi

# Prüfe ob Repository existiert
echo "🔍 Prüfe ob Repository existiert..."
if git ls-remote origin main > /dev/null 2>&1; then
    echo "✅ Repository existiert auf GitHub"
    echo ""
    echo "📤 Pushe Code..."
    git push -u origin main
    echo ""
    echo "✅ Code erfolgreich gepusht!"
else
    echo "❌ Repository existiert noch nicht auf GitHub"
    echo ""
    echo "💡 Erstelle zuerst Repository:"
    echo "   1. Gehe zu: https://github.com/new"
    echo "   2. Repository name: warenentnahme-telegram"
    echo "   3. Klicke: 'Create repository'"
    echo "   4. Dann nochmal: bash scripts/push-to-github.sh"
    exit 1
fi

