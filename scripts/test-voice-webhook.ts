#!/usr/bin/env node
/**
 * Test-Script: Simuliert eine Voice Message für den Webhook
 * 
 * Usage:
 *   pnpm tsx scripts/test-voice-webhook.ts
 */

import "dotenv/config";
import { createTelegramRoute } from "../src/routes/telegram.js";
import pino from "pino";

const logger = pino({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const allowedChatIds = process.env.ALLOWED_CHAT_IDS?.split(",").map(Number) || [];
const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [];

if (!botToken || !openaiApiKey) {
  console.error("❌ TELEGRAM_BOT_TOKEN oder OPENAI_API_KEY fehlt");
  process.exit(1);
}

const app = createTelegramRoute({
  botToken,
  openaiApiKey,
  allowedChatIds,
  allowedUserIds,
  outboundMode: "sheets",
  logger,
});

// Mock Voice Message Update
const mockUpdate = {
  update_id: 999999,
  message: {
    message_id: Date.now(),
    date: Math.floor(Date.now() / 1000),
    voice: {
      file_id: "test_voice_file_id",
      duration: 8,
      mime_type: "audio/ogg",
      file_size: 12345,
    },
    from: {
      id: allowedUserIds[0] || 6377811171,
      username: "test_user",
      first_name: "Test",
    },
    chat: {
      id: allowedChatIds[0] || -5025798709,
      type: "group" as const,
      title: "Test Chat",
    },
  },
};

console.log("🧪 Teste Voice Message Webhook...\n");
console.log("Mock Update:", JSON.stringify(mockUpdate, null, 2));

const request = new Request("http://localhost:3000/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(mockUpdate),
});

app.fetch(request).then(async (response) => {
  const result = await response.json();
  console.log("\n📋 Response:", JSON.stringify(result, null, 2));
}).catch((error) => {
  console.error("❌ Fehler:", error);
  process.exit(1);
});


