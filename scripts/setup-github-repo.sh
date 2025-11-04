#!/bin/bash
# Erstellt GitHub Repository und pusht Code
# 
# Usage:
#   bash scripts/setup-github-repo.sh <github-username>
#
# Beispiel:
#   bash scripts/setup-github-repo.sh dein-username

cd "$(dirname "$0")/.." || exit 1

GITHUB_USERNAME=$1
REPO_NAME="warenentnahme-telegram"

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub Username fehlt"
    echo "Usage: bash scripts/setup-github-repo.sh <github-username>"
    echo "Beispiel: bash scripts/setup-github-repo.sh dein-username"
    exit 1
fi

echo "🚀 Erstelle GitHub Repository..."
echo ""

# Prüfe ob git bereits initialisiert
if [ ! -d ".git" ]; then
    echo "📦 Initialisiere Git..."
    git init
fi

# Prüfe ob .gitignore existiert
if [ ! -f ".gitignore" ]; then
    echo "📝 Erstelle .gitignore..."
    cat > .gitignore << EOF
node_modules/
dist/
.env
*.log
.DS_Store
service-account-key.json
*.pid
EOF
fi

# Prüfe ob remote bereits existiert
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Git remote bereits vorhanden:"
    git remote get-url origin
    echo ""
    read -p "Überschreiben? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        git remote remove origin
    else
        echo "❌ Abgebrochen"
        exit 1
    fi
fi

# Remote hinzufügen
echo "🔗 Füge GitHub Remote hinzu..."
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
echo "📋 Nächste Schritte:"
echo ""
echo "1. Erstelle Repository auf GitHub:"
echo "   Gehe zu: https://github.com/new"
echo "   Name: ${REPO_NAME}"
echo "   (Privat oder öffentlich - deine Wahl)"
echo ""
echo "2. Dann pushe Code:"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git push -u origin main"
echo ""
echo "3. In Railway: 'GitHub Repository' wählen"
echo "   Dann Repository auswählen"
echo ""
echo "💡 Oder verwende Railway CLI direkt:"
echo "   railway init"
echo "   railway up"

