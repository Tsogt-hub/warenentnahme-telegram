#!/usr/bin/env node
/**
 * Löscht pending Updates von Telegram
 * 
 * Usage:
 *   pnpm tsx scripts/clear-pending-updates.ts
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN fehlt in .env");
  process.exit(1);
}

async function clearPendingUpdates() {
  try {
    // Hole Webhook-Info
    const infoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const infoResponse = await fetch(infoUrl);
    const info = await infoResponse.json();
    
    if (info.ok && info.result.pending_update_count > 0) {
      console.log(`📋 Aktueller Status:`);
      console.log(`   Pending Updates: ${info.result.pending_update_count}`);
      console.log(`   Letzter Fehler: ${info.result.last_error_message || "Keine"}`);
      
      // Lösche Webhook und setze wieder (mit drop_pending_updates)
      const deleteUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
      const deleteResponse = await fetch(deleteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drop_pending_updates: true,
        }),
      });

      const deleteResult = await deleteResponse.json();

      if (deleteResult.ok) {
        console.log("\n✅ Pending Updates gelöscht");
        
        // Webhook wieder setzen (falls URL vorhanden)
        if (info.result.url) {
          console.log(`\n🔄 Setze Webhook erneut...`);
          const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
          const setResponse = await fetch(setUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: info.result.url,
              allowed_updates: ["message"],
            }),
          });

          const setResult = await setResponse.json();
          
          if (setResult.ok) {
            console.log(`✅ Webhook wieder gesetzt: ${info.result.url}`);
          } else {
            console.log(`⚠️  Webhook konnte nicht wieder gesetzt werden: ${JSON.stringify(setResult)}`);
          }
        }
      } else {
        console.error("❌ Löschen fehlgeschlagen:");
        console.error(deleteResult);
        process.exit(1);
      }
    } else if (info.ok && info.result.pending_update_count === 0) {
      console.log("✅ Keine pending Updates vorhanden");
    } else {
      console.error("❌ Fehler beim Abruf der Webhook-Info:");
      console.error(info);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fehler:", error);
    process.exit(1);
  }
}

clearPendingUpdates();


