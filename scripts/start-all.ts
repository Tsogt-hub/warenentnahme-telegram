#!/usr/bin/env node
/**
 * Startet Server + Tunnel automatisch
 * 
 * Usage:
 *   pnpm tsx scripts/start-all.ts
 */

import "dotenv/config";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const port = Number(process.env.PORT) || 3000;

console.log("🚀 Starte Bot-Service (Server + Tunnel)...\n");
console.log("=".repeat(60));

// Prüfe ob Server bereits läuft
async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Prüfe ob Tunnel-Tool verfügbar ist
async function checkTunnelTool(): Promise<"lt" | "ngrok" | null> {
  return new Promise((resolve) => {
    const checkLt = spawn("which", ["lt"], { stdio: "pipe" });
    checkLt.on("close", (code) => {
      if (code === 0) {
        resolve("lt");
      } else {
        const checkNgrok = spawn("which", ["ngrok"], { stdio: "pipe" });
        checkNgrok.on("close", (code) => {
          if (code === 0) {
            resolve("ngrok");
          } else {
            resolve(null);
          }
        });
      }
    });
  });
}

async function startAll() {
  // 1. Prüfe Server
  const serverRunning = await checkServerRunning();
  if (serverRunning) {
    console.log("✅ Server läuft bereits auf Port " + port);
  } else {
    console.log("📡 Starte Server...");
    console.log("   💡 Tipp: Server läuft im Hintergrund");
    console.log("   💡 Für Logs: LOG_LEVEL=debug pnpm dev");
    console.log("\n   ⚠️  Bitte starte Server manuell in einem Terminal:");
    console.log(`      pnpm dev`);
    console.log("\n   Oder für Debug-Logs:");
    console.log(`      LOG_LEVEL=debug pnpm dev`);
  }

  // 2. Prüfe Tunnel-Tool
  const tunnelTool = await checkTunnelTool();
  if (!tunnelTool) {
    console.log("\n❌ Kein Tunnel-Tool gefunden");
    console.log("\n💡 Installation:");
    console.log("   localtunnel: npm install -g localtunnel");
    console.log("   ngrok: brew install ngrok");
    console.log("\n💡 Danach manuell starten:");
    if (tunnelTool === "lt") {
      console.log(`   lt --port ${port} --subdomain warenentnahme-bot`);
    } else {
      console.log(`   ngrok http ${port}`);
    }
    return;
  }

  // 3. Starte Tunnel
  console.log(`\n🔗 Starte Tunnel mit ${tunnelTool}...`);
  
  let tunnelProcess: ReturnType<typeof spawn> | null = null;
  let tunnelUrl: string | null = null;

  if (tunnelTool === "lt") {
    tunnelProcess = spawn("lt", ["--port", String(port), "--subdomain", "warenentnahme-bot"], {
      stdio: "pipe",
      cwd: projectRoot,
    });

    tunnelProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      console.log(output);
      
      // Extrahiere URL aus Output
      const urlMatch = output.match(/https:\/\/warenentnahme-bot\.loca\.lt/);
      if (urlMatch && !tunnelUrl) {
        tunnelUrl = urlMatch[0] + "/webhook";
        console.log(`\n✅ Tunnel gestartet!`);
        console.log(`📋 Webhook-URL: ${tunnelUrl}`);
        console.log(`\n💡 Webhook setzen mit:`);
        console.log(`   pnpm setup-webhook ${tunnelUrl}`);
      }
    });

    tunnelProcess.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      // Ignoriere normale Info-Messages
      if (!output.includes("your url is:")) {
        console.error(output);
      }
    });

    tunnelProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`\n❌ Tunnel beendet mit Code ${code}`);
      }
    });
  } else if (tunnelTool === "ngrok") {
    tunnelProcess = spawn("ngrok", ["http", String(port)], {
      stdio: "pipe",
      cwd: projectRoot,
    });

    console.log("\n✅ ngrok gestartet");
    console.log("📋 Bitte öffne http://localhost:4040 für die URL");
    console.log("💡 Dann Webhook setzen mit:");
    console.log("   pnpm setup-webhook <ngrok-url>/webhook");
  }

  // Cleanup bei Exit
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Beende Tunnel...");
    if (tunnelProcess) {
      tunnelProcess.kill();
    }
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    if (tunnelProcess) {
      tunnelProcess.kill();
    }
    process.exit(0);
  });

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Service läuft!");
  console.log("\n⚠️  WICHTIG:");
  console.log("   1. Server muss in separatem Terminal laufen: pnpm dev");
  console.log("   2. Tunnel läuft hier (dieses Terminal nicht schließen!)");
  if (tunnelUrl) {
    console.log(`   3. Webhook setzen: pnpm setup-webhook ${tunnelUrl}`);
  } else {
    console.log("   3. Webhook-URL aus ngrok-Interface kopieren");
  }
  console.log("\n💡 Zum Beenden: Ctrl+C");
}

startAll().catch(console.error);


