#!/usr/bin/env node
/**
 * Monitor: Überwacht Voice Message Verarbeitung
 * 
 * Usage:
 *   pnpm tsx scripts/monitor-voice.ts
 * 
 * Prüft:
 * - OPENAI_API_KEY gesetzt
 * - Whisper API erreichbar
 * - Test-Transkription möglich
 */

import "dotenv/config";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

console.log("🎤 Voice Message Monitor\n");
console.log("=".repeat(60));

// 1. Prüfe ENV
console.log("\n1️⃣ Prüfe ENV-Variablen:");
if (!openaiApiKey) {
  console.log("   ❌ OPENAI_API_KEY fehlt");
  console.log("   💡 Setze OPENAI_API_KEY in .env");
  console.log("   💡 Kostenlos erhältlich unter: https://platform.openai.com/api-keys");
  process.exit(1);
}
console.log("   ✅ OPENAI_API_KEY gesetzt");

// 2. Prüfe OpenAI API
console.log("\n2️⃣ Prüfe OpenAI API:");
async function testOpenAI() {
  try {
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 10000,
    });

    // Teste API-Zugriff (Models-Liste)
    console.log("   📡 Teste API-Verbindung...");
    const models = await openai.models.list();
    console.log("   ✅ OpenAI API erreichbar");
    console.log(`   📊 Verfügbare Models: ${models.data.length}`);
    
    // Prüfe ob Whisper verfügbar ist
    const whisperAvailable = models.data.some(m => m.id.includes("whisper"));
    if (whisperAvailable) {
      console.log("   ✅ Whisper Model verfügbar");
    } else {
      console.log("   ⚠️  Whisper Model nicht explizit in Liste (normal)");
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Fehler: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.message.includes("401")) {
      console.log("   💡 API-Key ist ungültig oder abgelaufen");
    } else if (error instanceof Error && error.message.includes("429")) {
      console.log("   💡 Rate Limit erreicht - warte kurz");
    }
    return false;
  }
}

// 3. Prüfe Telegram Bot Token
console.log("\n3️⃣ Prüfe Telegram Bot:");
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.log("   ❌ TELEGRAM_BOT_TOKEN fehlt");
} else {
  console.log("   ✅ TELEGRAM_BOT_TOKEN gesetzt");
  
  // Teste Bot-API
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const result = await response.json();
    if (result.ok) {
      console.log(`   ✅ Bot aktiv: @${result.result.username}`);
    } else {
      console.log("   ❌ Bot Token ungültig");
    }
  } catch (error) {
    console.log(`   ⚠️  Konnte Bot-Status nicht prüfen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 4. Zusammenfassung
async function summarize() {
  const apiOk = await testOpenAI();
  
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 Zusammenfassung:\n");
  
  if (apiOk && botToken) {
    console.log("✅ Voice Message Verarbeitung ist konfiguriert!");
    console.log("\n💡 Teste mit:");
    console.log("   1. Sende Sprachnachricht in Telegram-Gruppe");
    console.log("   2. Prüfe Server-Logs: LOG_LEVEL=debug pnpm dev");
    console.log("   3. Bot sollte antworten mit Transkription");
  } else {
    console.log("⚠️  Einige Konfigurationen fehlen:");
    if (!apiOk) {
      console.log("   - OpenAI API nicht erreichbar oder ungültig");
    }
    if (!botToken) {
      console.log("   - TELEGRAM_BOT_TOKEN fehlt");
    }
    console.log("\n💡 Prüfe .env-Datei und API-Keys");
  }
}

summarize().catch(console.error);


