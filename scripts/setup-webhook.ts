#!/usr/bin/env node
/**
 * Setup-Script für Telegram Webhook
 * 
 * Usage:
 *   pnpm tsx scripts/setup-webhook.ts <webhook-url>
 *   pnpm tsx scripts/setup-webhook.ts https://your-domain.com/webhook
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.argv[2];

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN fehlt in .env");
  process.exit(1);
}

if (!webhookUrl) {
  console.error("❌ Webhook-URL fehlt");
  console.error("Usage: pnpm tsx scripts/setup-webhook.ts <webhook-url>");
  process.exit(1);
}

async function setupWebhook() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log("✅ Webhook erfolgreich gesetzt");
      console.log(`   URL: ${webhookUrl}`);
      
      // Webhook-Info abrufen
      const infoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
      const infoResponse = await fetch(infoUrl);
      const info = await infoResponse.json();
      
      if (info.ok) {
        console.log("\n📋 Webhook-Info:");
        console.log(`   URL: ${info.result.url}`);
        console.log(`   Pending Updates: ${info.result.pending_update_count}`);
        console.log(`   Last Error: ${info.result.last_error_date ? new Date(info.result.last_error_date * 1000).toISOString() : "Keine"}`);
      }
    } else {
      console.error("❌ Webhook-Setup fehlgeschlagen:");
      console.error(result);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fehler beim Setup:", error);
    process.exit(1);
  }
}

setupWebhook();

