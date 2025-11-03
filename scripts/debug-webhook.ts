#!/usr/bin/env node
/**
 * Debug-Script: Simuliert einen Telegram-Webhook-Request
 * Hilft beim Testen ohne echten Telegram-Request
 */

import "dotenv/config";
import { createTelegramRoute } from "../src/routes/telegram.js";
import { serve } from "@hono/node-server";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "debug",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const claudeApiKey = process.env.CLAUDE_API_KEY;
const allowedChatIds = process.env.ALLOWED_CHAT_IDS?.split(",").map(Number) || [];
const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [];

if (!botToken || !claudeApiKey) {
  console.error("❌ TELEGRAM_BOT_TOKEN oder CLAUDE_API_KEY fehlt");
  process.exit(1);
}

const app = createTelegramRoute({
  botToken,
  claudeApiKey,
  allowedChatIds,
  allowedUserIds,
  outboundMode: "sheets",
  logger,
});

// Test-Endpoint für manuelle Requests
app.post("/test", async (c) => {
  const testMessage = c.req.query("message") || "nimm 3x M8-Schrauben aus Regal A3";
  const chatId = Number(c.req.query("chat_id") || "-5025798709");
  const userId = Number(c.req.query("user_id") || "6377811171");

  const mockUpdate = {
    update_id: 999999,
    message: {
      message_id: Date.now(),
      date: Math.floor(Date.now() / 1000),
      text: testMessage,
      from: {
        id: userId,
        username: "test_user",
        first_name: "Test",
      },
      chat: {
        id: chatId,
        type: chatId < 0 ? "group" : "private",
        title: "Test Chat",
      },
    },
  };

  logger.info({ mockUpdate }, "Test-Request");

  return app.fetch(
    new Request("http://localhost:3000/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockUpdate),
    })
  );
});

const port = Number(process.env.PORT) || 3000;

logger.info({ port }, "Debug-Server startet");

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info({ url: `http://localhost:${info.port}` }, "Debug-Server läuft");
    logger.info(
      {},
      `Test mit: curl "http://localhost:${info.port}/test?message=nimm%205x%20Schrauben"`
    );
  }
);

