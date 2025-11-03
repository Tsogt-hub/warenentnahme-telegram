#!/usr/bin/env node
/**
 * Löscht den Telegram Webhook
 * 
 * Usage:
 *   pnpm tsx scripts/delete-webhook.ts
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN fehlt in .env");
  process.exit(1);
}

async function deleteWebhook() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drop_pending_updates: true,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log("✅ Webhook erfolgreich gelöscht");
    } else {
      console.error("❌ Webhook-Löschung fehlgeschlagen:");
      console.error(result);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fehler beim Löschen:", error);
    process.exit(1);
  }
}

deleteWebhook();

