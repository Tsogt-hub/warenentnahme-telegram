#!/bin/bash
# Test-Script: Simuliert einen Telegram-Webhook-Request direkt

echo "🧪 Teste lokalen Webhook..."
echo ""

# Test-Nachricht
MESSAGE="nimm 3x M8-Schrauben aus Regal A3"
CHAT_ID="-5025798709"
USER_ID="6377811171"
MESSAGE_ID=$(date +%s)

# Mock Telegram Update
PAYLOAD=$(cat <<EOF
{
  "update_id": 999999,
  "message": {
    "message_id": ${MESSAGE_ID},
    "date": ${MESSAGE_ID},
    "text": "${MESSAGE}",
    "from": {
      "id": ${USER_ID},
      "username": "test_user",
      "first_name": "Test"
    },
    "chat": {
      "id": ${CHAT_ID},
      "type": "group",
      "title": "Test Group"
    }
  }
}
EOF
)

echo "📤 Sende Test-Request..."
echo "   Nachricht: ${MESSAGE}"
echo "   Chat-ID: ${CHAT_ID}"
echo ""

# Sende Request
RESPONSE=$(curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

echo "📥 Response:"
echo "${RESPONSE}" | jq . 2>/dev/null || echo "${RESPONSE}"
echo ""

echo "✅ Prüfe jetzt:"
echo "   1. Server-Terminal: Logs sollten erscheinen"
echo "   2. Google Sheets: Neue Zeile sollte erscheinen"
echo ""

