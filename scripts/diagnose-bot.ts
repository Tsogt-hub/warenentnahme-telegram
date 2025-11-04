#!/usr/bin/env node
/**
 * Diagnose-Script: Prüft alle möglichen Ursachen, warum der Bot nicht reagiert
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const allowedChatIds = process.env.ALLOWED_CHAT_IDS?.split(",").map(Number) || [];
const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [];
const port = Number(process.env.PORT) || 3000;

console.log("🔍 Bot-Diagnose gestartet...\n");
console.log("=" .repeat(60));

// 1. ENV-Variablen prüfen
console.log("\n1️⃣ ENV-Variablen:");
console.log(`   TELEGRAM_BOT_TOKEN: ${botToken ? "✅ Gesetzt" : "❌ FEHLT"}`);
console.log(`   OPENAI_API_KEY: ${openaiApiKey ? "✅ Gesetzt" : "❌ FEHLT"}`);
console.log(`   ALLOWED_CHAT_IDS: ${allowedChatIds.length > 0 ? `✅ ${allowedChatIds.join(", ")}` : "⚠️  Keine gesetzt"}`);
console.log(`   ALLOWED_USER_IDS: ${allowedUserIds.length > 0 ? `✅ ${allowedUserIds.join(", ")}` : "⚠️  Keine gesetzt"}`);
console.log(`   PORT: ${port}`);

// 2. Webhook-Status prüfen
console.log("\n2️⃣ Telegram Webhook-Status:");
async function checkWebhook() {
  if (!botToken) {
    console.log("   ⏭️  Übersprungen (kein Bot Token)");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      console.log(`   URL: ${info.url || "❌ NICHT GESETZT"}`);
      console.log(`   Pending Updates: ${info.pending_update_count || 0}`);
      
      if (info.pending_update_count > 0) {
        console.log(`   ⚠️  ${info.pending_update_count} Updates warten auf Verarbeitung!`);
        console.log(`   💡 Lösung: Server neu starten oder Webhook-URL prüfen`);
      }

      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000).toISOString();
        console.log(`\n   ❌ Letzter Fehler:`);
        console.log(`      Datum: ${errorDate}`);
        console.log(`      Fehler: ${info.last_error_message || "Unbekannt"}`);
        console.log(`   💡 Lösung: Webhook-URL ist nicht erreichbar. Prüfe ob Server/ngrok läuft.`);
      } else if (info.url) {
        console.log(`   ✅ Keine Fehler`);
      }

      if (!info.url) {
        console.log(`\n   ❌ WEBHOOK NICHT GESETZT!`);
        console.log(`   💡 Lösung:`);
        console.log(`      1. ngrok starten: ngrok http ${port}`);
        console.log(`      2. Webhook setzen: pnpm setup-webhook <ngrok-url>/webhook`);
      }
    } else {
      console.error(`   ❌ Fehler beim Abruf: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error(`   ❌ Fehler: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 3. Server erreichbar?
console.log("\n3️⃣ Server-Erreichbarkeit:");
async function checkServer() {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Server läuft auf Port ${port}`);
      console.log(`   Cache Size: ${data.cacheSize || 0}`);
    } else {
      console.log(`   ⚠️  Server antwortet mit Status ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`   ❌ Server nicht erreichbar (Timeout)`);
    } else {
      console.log(`   ❌ Server nicht erreichbar: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log(`   💡 Lösung: Server starten mit 'pnpm dev' oder 'LOG_LEVEL=debug pnpm dev'`);
  }
}

// 4. Tunnel-Status prüfen
console.log("\n4️⃣ Tunnel-Status:");
async function checkTunnel() {
  try {
    // Prüfe ob Tunnel-Prozess läuft
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Prüfe localtunnel
    try {
      await execAsync("pgrep -f 'lt --port'");
      console.log(`   ✅ localtunnel läuft`);
      return true;
    } catch {
      // Prüfe ngrok
      try {
        await execAsync("pgrep -f 'ngrok http'");
        console.log(`   ✅ ngrok läuft`);
        return true;
      } catch {
        console.log(`   ❌ Kein Tunnel-Prozess gefunden`);
        console.log(`   💡 Lösung: lt --port ${port} --subdomain warenentnahme-bot`);
        return false;
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Konnte Tunnel-Status nicht prüfen`);
    console.log(`   💡 Manuell prüfen: ps aux | grep -E 'lt|ngrok'`);
    return false;
  }
}

// 5. Webhook-Info-Endpoint (optional, falls Server läuft)
console.log("\n5️⃣ Webhook-Info-Endpoint:");
async function checkWebhookInfo() {
  try {
    const response = await fetch(`http://localhost:${port}/webhook/info`, {
      signal: AbortSignal.timeout(2000),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.webhook) {
        console.log(`   ✅ Webhook-Info abrufbar`);
        console.log(`   URL: ${data.webhook.url || "Nicht gesetzt"}`);
        console.log(`   Pending: ${data.webhook.pending_update_count || 0}`);
      }
    } else if (response.status === 404) {
      console.log(`   ⚠️  Endpoint nicht gefunden (Status 404)`);
      console.log(`   💡 Das ist normal - Endpoint ist optional`);
    } else {
      console.log(`   ⚠️  Endpoint antwortet mit Status ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`   ⏭️  Übersprungen (Server nicht erreichbar)`);
    } else {
      console.log(`   ⏭️  Übersprungen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 5. Zusammenfassung
async function summarize() {
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 Zusammenfassung & Nächste Schritte:\n");
  
  console.log("✅ Prüfe diese Punkte:");
  console.log("   1. Läuft der Server? → Terminal: 'pnpm dev'");
  console.log("   2. Ist ngrok aktiv? → Terminal: 'ngrok http 3000'");
  console.log("   3. Ist Webhook gesetzt? → 'pnpm check-webhook'");
  console.log("   4. Sind Chat-ID/User-ID korrekt? → Prüfe .env");
  console.log("\n💡 Debug-Modus für detaillierte Logs:");
  console.log("   LOG_LEVEL=debug pnpm dev");
  console.log("\n💡 Manueller Test:");
  console.log("   pnpm tsx scripts/debug-webhook.ts");
  console.log("   # Dann in anderem Terminal:");
  console.log(`   curl "http://localhost:${port}/test?message=nimm%205x%20Schrauben"`);
}

// Alles ausführen
async function runDiagnostics() {
  await checkWebhook();
  await checkServer();
  await checkTunnel();
  await checkWebhookInfo();
  await summarize();
}

runDiagnostics().catch(console.error);

