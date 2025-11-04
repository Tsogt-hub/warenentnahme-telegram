#!/usr/bin/env node
/**
 * Test: Sendet direkt ein Test-Update an den Webhook
 * 
 * Usage:
 *   pnpm tsx scripts/test-webhook-direct.ts
 */

import "dotenv/config";

const port = Number(process.env.PORT) || 3000;
const allowedChatIds = process.env.ALLOWED_CHAT_IDS?.split(",").map(Number) || [-5025798709];
const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [6377811171];

// Test-Update mit Voice Message
const testUpdate = {
  update_id: Date.now(),
  message: {
    message_id: Date.now(),
    date: Math.floor(Date.now() / 1000),
    voice: {
      file_id: "test_voice_file_id_123",
      duration: 8,
      mime_type: "audio/ogg",
      file_size: 12345,
    },
    from: {
      id: allowedUserIds[0],
      username: "test_user",
      first_name: "Test",
    },
    chat: {
      id: allowedChatIds[0],
      type: "group",
      title: "Test Chat",
    },
  },
};

console.log("🧪 Teste Webhook direkt...\n");
console.log("Update:", JSON.stringify(testUpdate, null, 2));
console.log("\n📡 Sende an http://localhost:" + port + "/webhook\n");

try {
  const response = await fetch(`http://localhost:${port}/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUpdate),
  });

  const result = await response.json();
  
  console.log("📋 Response:");
  console.log("   Status:", response.status);
  console.log("   Body:", JSON.stringify(result, null, 2));

  if (response.ok) {
    console.log("\n✅ Webhook antwortet!");
  } else {
    console.log("\n❌ Webhook Fehler:", response.status);
  }
} catch (error) {
  console.error("❌ Fehler:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}


