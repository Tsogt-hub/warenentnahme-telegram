#!/usr/bin/env node
/**
 * Prüft Webhook-Status
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN fehlt");
  process.exit(1);
}

async function checkWebhook() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();

    console.log("📋 Telegram Webhook-Status:\n");

    if (result.ok) {
      const info = result.result;
      console.log(`URL: ${info.url || "❌ NICHT GESETZT"}`);
      console.log(`Pending Updates: ${info.pending_update_count || 0}`);
      
      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000).toISOString();
        console.log(`\n❌ Letzter Fehler:`);
        console.log(`   Datum: ${errorDate}`);
        console.log(`   Fehler: ${info.last_error_message || "Unbekannt"}`);
      } else {
        console.log(`\n✅ Keine Fehler`);
      }

      if (!info.url) {
        console.log("\n⚠️  WEBHOOK NICHT GESETZT!");
        console.log("\n💡 Lösung:");
        console.log("   1. Für lokale Tests: ngrok verwenden");
        console.log("   2. Oder Production-URL verwenden");
        console.log("   3. Dann: pnpm setup-webhook <url>");
      } else if (!info.url.startsWith("http")) {
        console.log("\n⚠️  Webhook-URL ist ungültig!");
      }
    } else {
      console.error("❌ Fehler beim Abruf:", result);
    }
  } catch (error) {
    console.error("❌ Fehler:", error instanceof Error ? error.message : String(error));
  }
}

checkWebhook();

