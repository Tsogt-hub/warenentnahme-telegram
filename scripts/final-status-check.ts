#!/usr/bin/env node
/**
 * Finaler Status-Check: Prüft alles vor dem Start
 * 
 * Usage:
 *   pnpm tsx scripts/final-status-check.ts
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const port = Number(process.env.PORT) || 3000;

console.log("🔍 Finaler Status-Check\n");
console.log("=".repeat(60));

let allOk = true;
const issues: string[] = [];
const ok: string[] = [];

// 1. ENV-Variablen
console.log("\n1️⃣ ENV-Variablen:");
if (botToken) {
  ok.push("TELEGRAM_BOT_TOKEN");
  console.log("   ✅ TELEGRAM_BOT_TOKEN");
} else {
  issues.push("TELEGRAM_BOT_TOKEN fehlt");
  console.log("   ❌ TELEGRAM_BOT_TOKEN fehlt");
  allOk = false;
}

if (openaiApiKey) {
  ok.push("OPENAI_API_KEY");
  console.log("   ✅ OPENAI_API_KEY");
} else {
  issues.push("OPENAI_API_KEY fehlt");
  console.log("   ❌ OPENAI_API_KEY fehlt");
  allOk = false;
}

// 2. Server
console.log("\n2️⃣ Server:");
try {
  const response = await fetch(`http://localhost:${port}/health`, {
    signal: AbortSignal.timeout(2000),
  });
  if (response.ok) {
    ok.push("Server läuft");
    console.log(`   ✅ Server läuft auf Port ${port}`);
  } else {
    issues.push("Server antwortet mit Fehler");
    console.log(`   ⚠️  Server antwortet mit Status ${response.status}`);
    allOk = false;
  }
} catch {
  issues.push("Server läuft nicht");
  console.log("   ❌ Server läuft nicht");
  console.log("   💡 Starte mit: pnpm dev");
  allOk = false;
}

// 3. Tunnel
console.log("\n3️⃣ Tunnel:");
const { exec } = await import("child_process");
const { promisify } = await import("util");
const execAsync = promisify(exec);

try {
  await execAsync("pgrep -f 'lt --port'");
  ok.push("Tunnel läuft (localtunnel)");
  console.log("   ✅ localtunnel läuft");
} catch {
  try {
    await execAsync("pgrep -f 'ngrok http'");
    ok.push("Tunnel läuft (ngrok)");
    console.log("   ✅ ngrok läuft");
  } catch {
    issues.push("Tunnel läuft nicht");
    console.log("   ❌ Tunnel läuft nicht");
    console.log("   💡 Starte mit: lt --port 3000 --subdomain warenentnahme-bot");
    allOk = false;
  }
}

// 4. Webhook
console.log("\n4️⃣ Webhook:");
if (botToken) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      if (info.url) {
        ok.push("Webhook gesetzt");
        console.log(`   ✅ Webhook gesetzt: ${info.url}`);
        if (info.pending_update_count > 0) {
          issues.push(`${info.pending_update_count} pending Updates`);
          console.log(`   ⚠️  ${info.pending_update_count} pending Updates`);
          console.log("   💡 Lösche mit: pnpm clear-pending");
        }
        if (info.last_error_date) {
          issues.push("Webhook hat Fehler");
          console.log(`   ⚠️  Letzter Fehler: ${info.last_error_message}`);
        }
      } else {
        issues.push("Webhook nicht gesetzt");
        console.log("   ❌ Webhook nicht gesetzt");
        console.log("   💡 Setze mit: pnpm setup-webhook <url>");
        allOk = false;
      }
    }
  } catch (error) {
    issues.push("Webhook-Status nicht prüfbar");
    console.log(`   ⚠️  Konnte Webhook-Status nicht prüfen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 5. OpenAI API
console.log("\n5️⃣ OpenAI API:");
if (openaiApiKey) {
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 10000,
    });
    await openai.models.list();
    ok.push("OpenAI API erreichbar");
    console.log("   ✅ OpenAI API erreichbar");
  } catch (error) {
    issues.push("OpenAI API nicht erreichbar");
    console.log(`   ❌ OpenAI API Fehler: ${error instanceof Error ? error.message : String(error)}`);
    allOk = false;
  }
}

// Zusammenfassung
console.log("\n" + "=".repeat(60));
console.log("\n📋 Zusammenfassung:\n");

if (allOk && issues.length === 0) {
  console.log("✅ ALLES OK - System ist bereit!");
  console.log("\n✅ Funktioniert:");
  ok.forEach((item) => console.log(`   - ${item}`));
  console.log("\n🎯 Nächste Schritte:");
  console.log("   1. Sende Test-Nachricht in Telegram");
  console.log("   2. Prüfe Server-Logs");
  console.log("   3. Bot sollte antworten");
} else {
  console.log("⚠️  EINIGE PROBLEME GEFUNDEN\n");
  
  if (ok.length > 0) {
    console.log("✅ Funktioniert:");
    ok.forEach((item) => console.log(`   - ${item}`));
  }
  
  if (issues.length > 0) {
    console.log("\n❌ Probleme:");
    issues.forEach((item) => console.log(`   - ${item}`));
  }
  
  console.log("\n💡 Lösungen:");
  if (issues.some((i) => i.includes("Server"))) {
    console.log("   - Server starten: pnpm dev");
  }
  if (issues.some((i) => i.includes("Tunnel"))) {
    console.log("   - Tunnel starten: lt --port 3000 --subdomain warenentnahme-bot");
  }
  if (issues.some((i) => i.includes("Webhook"))) {
    console.log("   - Webhook setzen: pnpm setup-webhook <url>");
  }
  if (issues.some((i) => i.includes("pending"))) {
    console.log("   - Pending löschen: pnpm clear-pending");
  }
  
  console.log("\n💡 Vollständige Diagnose: pnpm diagnose");
}

process.exit(allOk && issues.length === 0 ? 0 : 1);


