#!/usr/bin/env node
/**
 * Quick-Fix: Versucht alle Probleme automatisch zu beheben
 * 
 * Usage:
 *   pnpm tsx scripts/quick-fix.ts
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const port = Number(process.env.PORT) || 3000;

console.log("🔧 Quick-Fix gestartet...\n");
console.log("=".repeat(60));

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN fehlt in .env");
  process.exit(1);
}

async function quickFix() {
  const fixes: string[] = [];
  const warnings: string[] = [];

  // 1. Prüfe Webhook-Status
  console.log("\n1️⃣ Prüfe Webhook-Status...");
  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      
      if (info.pending_update_count > 0) {
        console.log(`   ⚠️  ${info.pending_update_count} pending Updates gefunden`);
        console.log(`   🔄 Lösche pending Updates...`);
        
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
          fixes.push("Pending Updates gelöscht");
          console.log(`   ✅ Pending Updates gelöscht`);
          
          // Webhook wieder setzen falls vorhanden
          if (info.url) {
            const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
            const setResponse = await fetch(setUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: info.url,
                allowed_updates: ["message"],
              }),
            });
            const setResult = await setResponse.json();
            if (setResult.ok) {
              console.log(`   ✅ Webhook wieder gesetzt`);
            }
          }
        } else {
          warnings.push("Konnte pending Updates nicht löschen");
        }
      } else {
        console.log(`   ✅ Keine pending Updates`);
      }

      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000).toISOString();
        console.log(`\n   ⚠️  Letzter Fehler: ${info.last_error_message || "Unbekannt"}`);
        console.log(`   📅 Datum: ${errorDate}`);
        warnings.push(`Webhook-Fehler: ${info.last_error_message}`);
      }

      if (!info.url) {
        console.log(`\n   ❌ Webhook nicht gesetzt`);
        warnings.push("Webhook-URL nicht gesetzt - bitte manuell setzen");
      } else {
        console.log(`   ✅ Webhook-URL: ${info.url}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Fehler beim Prüfen: ${error instanceof Error ? error.message : String(error)}`);
    warnings.push("Konnte Webhook-Status nicht prüfen");
  }

  // 2. Prüfe Server-Erreichbarkeit
  console.log("\n2️⃣ Prüfe Server-Erreichbarkeit...");
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Server läuft auf Port ${port}`);
      console.log(`   📊 Cache Size: ${data.cacheSize || 0}`);
    } else {
      warnings.push(`Server antwortet mit Status ${response.status}`);
      console.log(`   ⚠️  Server antwortet mit Status ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      warnings.push("Server nicht erreichbar - bitte Server starten");
      console.log(`   ❌ Server nicht erreichbar (läuft wahrscheinlich nicht)`);
      console.log(`   💡 Lösung: pnpm dev`);
    } else {
      warnings.push(`Server-Fehler: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`   ❌ Server-Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Zusammenfassung
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 Zusammenfassung:\n");

  if (fixes.length > 0) {
    console.log("✅ Behobene Probleme:");
    fixes.forEach(fix => console.log(`   - ${fix}`));
    console.log();
  }

  if (warnings.length > 0) {
    console.log("⚠️  Manuelle Schritte erforderlich:");
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log();
  }

  if (fixes.length === 0 && warnings.length === 0) {
    console.log("✅ Alles sieht gut aus!");
  } else {
    console.log("💡 Nächste Schritte:");
    if (warnings.some(w => w.includes("Server nicht erreichbar"))) {
      console.log("   1. Server starten: pnpm dev");
    }
    if (warnings.some(w => w.includes("Webhook-URL nicht gesetzt"))) {
      console.log("   2. Tunnel starten: lt --port 3000 --subdomain warenentnahme-bot");
      console.log("   3. Webhook setzen: pnpm setup-webhook <url>/webhook");
    }
    if (warnings.some(w => w.includes("Webhook-Fehler"))) {
      console.log("   4. Tunnel prüfen (muss laufen und erreichbar sein)");
    }
  }
}

quickFix().catch(console.error);


