#!/usr/bin/env node
/**
 * Watchdog: Überwacht Server und Tunnel kontinuierlich
 * 
 * Usage:
 *   pnpm tsx scripts/watchdog.ts
 * 
 * Prüft alle 30 Sekunden:
 * - Server-Erreichbarkeit
 * - Tunnel-Status
 * - Webhook-Status
 * - Pending Updates
 */

import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const port = Number(process.env.PORT) || 3000;
const checkInterval = 30000; // 30 Sekunden

let consecutiveErrors = 0;
const maxErrors = 3;

console.log("🐕 Watchdog gestartet...\n");
console.log("=".repeat(60));
console.log(`📊 Überwache System alle ${checkInterval / 1000} Sekunden`);
console.log("💡 Zum Beenden: Ctrl+C\n");

interface SystemStatus {
  server: boolean;
  tunnel: boolean;
  webhook: {
    set: boolean;
    pending: number;
    hasError: boolean;
    error?: string;
  };
  healthy: boolean;
}

async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkTunnel(): Promise<boolean> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      await execAsync("pgrep -f 'lt --port'");
      return true;
    } catch {
      try {
        await execAsync("pgrep -f 'ngrok http'");
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}

async function checkWebhook(): Promise<{
  set: boolean;
  pending: number;
  hasError: boolean;
  error?: string;
}> {
  if (!botToken) {
    return { set: false, pending: 0, hasError: true, error: "No bot token" };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      return {
        set: !!info.url,
        pending: info.pending_update_count || 0,
        hasError: !!info.last_error_date,
        error: info.last_error_message,
      };
    }

    return { set: false, pending: 0, hasError: true, error: "API error" };
  } catch (error) {
    return {
      set: false,
      pending: 0,
      hasError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkSystem(): Promise<SystemStatus> {
  const [server, tunnel, webhook] = await Promise.all([
    checkServer(),
    checkTunnel(),
    checkWebhook(),
  ]);

  const healthy = server && tunnel && webhook.set && !webhook.hasError && webhook.pending === 0;

  return {
    server,
    tunnel,
    webhook,
    healthy,
  };
}

function formatStatus(status: SystemStatus): string {
  const timestamp = new Date().toISOString();
  let output = `\n[${timestamp}] System-Status:\n`;
  
  output += `  Server:   ${status.server ? "✅" : "❌"}\n`;
  output += `  Tunnel:   ${status.tunnel ? "✅" : "❌"}\n`;
  output += `  Webhook:  ${status.webhook.set ? "✅" : "❌"}`;
  
  if (status.webhook.pending > 0) {
    output += ` (⚠️  ${status.webhook.pending} pending)`;
  }
  
  if (status.webhook.hasError) {
    output += ` (❌ ${status.webhook.error})`;
  }
  
  output += "\n";
  output += `  Status:   ${status.healthy ? "✅ GESUND" : "⚠️  PROBLEME"}\n`;
  
  return output;
}

async function runWatchdog() {
  while (true) {
    try {
      const status = await checkSystem();
      
      if (status.healthy) {
        consecutiveErrors = 0;
        // Nur bei Status-Änderung ausgeben
        if (process.stdout.isTTY) {
          process.stdout.write("\r" + " ".repeat(80) + "\r");
          process.stdout.write(`[${new Date().toLocaleTimeString()}] ✅ System OK`);
        }
      } else {
        consecutiveErrors++;
        console.log(formatStatus(status));
        
        // Warnungen ausgeben
        if (!status.server) {
          console.log("   💡 Server läuft nicht: pnpm dev");
        }
        if (!status.tunnel) {
          console.log("   💡 Tunnel läuft nicht: lt --port 3000 --subdomain warenentnahme-bot");
        }
        if (!status.webhook.set) {
          console.log("   💡 Webhook nicht gesetzt: pnpm setup-webhook <url>");
        }
        if (status.webhook.pending > 0) {
          console.log("   💡 Pending Updates: pnpm clear-pending");
        }
        if (status.webhook.hasError) {
          console.log(`   💡 Webhook-Fehler: ${status.webhook.error}`);
        }
        
        if (consecutiveErrors >= maxErrors) {
          console.log("\n⚠️  Mehrere aufeinanderfolgende Fehler erkannt!");
          console.log("💡 Führe 'pnpm diagnose' aus für vollständige Analyse.\n");
        }
      }
    } catch (error) {
      console.error(`\n❌ Watchdog-Fehler: ${error instanceof Error ? error.message : String(error)}`);
      consecutiveErrors++;
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }
}

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Watchdog beendet");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Watchdog beendet");
  process.exit(0);
});

runWatchdog().catch(console.error);


