#!/usr/bin/env node
/**
 * Auto-Setup: Richtet alles automatisch ein
 * 
 * Usage:
 *   pnpm tsx scripts/auto-setup.ts
 * 
 * Führt automatisch aus:
 * 1. Prüft ENV-Variablen
 * 2. Prüft ob Server läuft
 * 3. Startet Tunnel (falls möglich)
 * 4. Setzt Webhook (falls URL verfügbar)
 * 5. Löscht pending Updates
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const allowedChatIds = process.env.ALLOWED_CHAT_IDS?.split(",").map(Number) || [];
const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [];
const port = Number(process.env.PORT) || 3000;

console.log("🚀 Auto-Setup gestartet...\n");
console.log("=".repeat(60));

const steps: Array<{ name: string; success: boolean; message?: string }> = [];

// 1. ENV-Variablen prüfen
console.log("\n1️⃣ Prüfe ENV-Variablen...");
if (!botToken) {
  console.log("   ❌ TELEGRAM_BOT_TOKEN fehlt");
  steps.push({ name: "ENV: Bot Token", success: false, message: "TELEGRAM_BOT_TOKEN fehlt" });
  process.exit(1);
}
if (!openaiApiKey) {
  console.log("   ❌ OPENAI_API_KEY fehlt");
  steps.push({ name: "ENV: OpenAI Key", success: false, message: "OPENAI_API_KEY fehlt" });
  process.exit(1);
}
console.log("   ✅ ENV-Variablen OK");
steps.push({ name: "ENV-Variablen", success: true });

// 2. Server prüfen
console.log("\n2️⃣ Prüfe Server...");
async function checkServer() {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      console.log("   ✅ Server läuft");
      steps.push({ name: "Server", success: true });
      return true;
    }
  } catch {
    // Server läuft nicht
  }
  console.log("   ⚠️  Server läuft nicht");
  console.log("   💡 Starte Server manuell: pnpm dev");
  steps.push({ name: "Server", success: false, message: "Server nicht erreichbar" });
  return false;
}

// 3. Tunnel prüfen/starten
console.log("\n3️⃣ Prüfe Tunnel...");
async function checkTunnel() {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Prüfe ob localtunnel installiert
  try {
    await execAsync("which lt");
    console.log("   ✅ localtunnel gefunden");
    
    // Prüfe ob bereits läuft
    try {
      await execAsync("pgrep -f 'lt --port'");
      console.log("   ✅ Tunnel läuft bereits");
      steps.push({ name: "Tunnel", success: true });
      return "https://warenentnahme-bot.loca.lt/webhook";
    } catch {
      console.log("   💡 Tunnel läuft nicht - bitte manuell starten:");
      console.log(`      lt --port ${port} --subdomain warenentnahme-bot`);
      steps.push({ name: "Tunnel", success: false, message: "Tunnel nicht gestartet" });
      return null;
    }
  } catch {
    // Prüfe ngrok
    try {
      await execAsync("which ngrok");
      console.log("   ✅ ngrok gefunden");
      try {
        await execAsync("pgrep -f 'ngrok http'");
        console.log("   ✅ Tunnel läuft bereits");
        steps.push({ name: "Tunnel", success: true });
        console.log("   💡 Bitte URL aus ngrok-Interface kopieren (http://localhost:4040)");
        return null; // Ngrok URL muss manuell kopiert werden
      } catch {
        console.log("   💡 Tunnel läuft nicht - bitte manuell starten:");
        console.log(`      ngrok http ${port}`);
        steps.push({ name: "Tunnel", success: false, message: "Tunnel nicht gestartet" });
        return null;
      }
    } catch {
      console.log("   ❌ Kein Tunnel-Tool gefunden");
      console.log("   💡 Installation:");
      console.log("      localtunnel: npm install -g localtunnel");
      console.log("      ngrok: brew install ngrok");
      steps.push({ name: "Tunnel", success: false, message: "Kein Tunnel-Tool installiert" });
      return null;
    }
  }
}

// 4. Webhook prüfen/setzen
async function checkWebhook() {
  if (!botToken) return;

  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      
      if (info.pending_update_count > 0) {
        console.log(`\n4️⃣ Lösche ${info.pending_update_count} pending Updates...`);
        const deleteUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
        await fetch(deleteUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drop_pending_updates: true }),
        });
        
        if (info.url) {
          // Webhook wieder setzen
          const setUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
          await fetch(setUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: info.url,
              allowed_updates: ["message"],
            }),
          });
        }
        
        console.log("   ✅ Pending Updates gelöscht");
        steps.push({ name: "Pending Updates", success: true });
      } else {
        console.log("\n4️⃣ Prüfe Webhook...");
        console.log("   ✅ Keine pending Updates");
        steps.push({ name: "Pending Updates", success: true });
      }

      if (info.url) {
        console.log(`   ✅ Webhook gesetzt: ${info.url}`);
        steps.push({ name: "Webhook", success: true });
      } else {
        console.log("   ⚠️  Webhook nicht gesetzt");
        steps.push({ name: "Webhook", success: false, message: "Webhook nicht gesetzt" });
      }

      if (info.last_error_date) {
        console.log(`   ⚠️  Letzter Fehler: ${info.last_error_message}`);
        steps.push({ name: "Webhook Fehler", success: false, message: info.last_error_message });
      }
    }
  } catch (error) {
    console.log(`   ❌ Fehler: ${error instanceof Error ? error.message : String(error)}`);
    steps.push({ name: "Webhook", success: false });
  }
}

// Hauptfunktion
async function autoSetup() {
  const serverRunning = await checkServer();
  const tunnelUrl = await checkTunnel();
  await checkWebhook();

  // Zusammenfassung
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 Setup-Zusammenfassung:\n");

  const successCount = steps.filter((s) => s.success).length;
  const totalSteps = steps.length;

  steps.forEach((step) => {
    const icon = step.success ? "✅" : "❌";
    console.log(`   ${icon} ${step.name}${step.message ? ` (${step.message})` : ""}`);
  });

  console.log(`\n✅ ${successCount}/${totalSteps} Schritte erfolgreich\n`);

  if (successCount === totalSteps) {
    console.log("🎉 Alles konfiguriert! Bot sollte funktionieren.");
  } else {
    console.log("⚠️  Einige Schritte benötigen manuelle Aufmerksamkeit:\n");
    
    if (!serverRunning) {
      console.log("   1. Server starten: pnpm dev");
    }
    if (!tunnelUrl) {
      console.log("   2. Tunnel starten: lt --port 3000 --subdomain warenentnahme-bot");
    }
    console.log("\n💡 Führe 'pnpm diagnose' aus für detaillierte Analyse.");
  }
}

autoSetup().catch(console.error);


