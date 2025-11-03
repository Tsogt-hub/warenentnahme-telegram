#!/usr/bin/env node
/**
 * Test-Script für Google Sheets Verbindung
 * Prüft ob Service Account korrekt konfiguriert ist
 */

import "dotenv/config";
import { createSheetsClientFromEnv } from "../src/adapters/sheets.js";
import pino from "pino";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

async function testSheets() {
  console.log("🧪 Google Sheets Verbindungstest\n");

  // ENV prüfen
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const worksheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || "Transaktionen";
  const inventoryWorksheetName =
    process.env.GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME || "Lagerbestand";

  console.log("📋 Konfiguration:");
  console.log(`   Spreadsheet-ID: ${spreadsheetId || "❌ FEHLT"}`);
  console.log(`   Service Account Key: ${serviceAccountKey ? "✅ Gesetzt" : "❌ FEHLT"}`);
  console.log(`   Worksheet Transaktionen: ${worksheetName}`);
  console.log(`   Worksheet Lagerbestand: ${inventoryWorksheetName}`);
  console.log("");

  if (!spreadsheetId || !serviceAccountKey) {
    console.error("❌ Fehlende ENV-Variablen!");
    process.exit(1);
  }

  try {
    // Sheets-Client erstellen
    console.log("🔌 Verbinde zu Google Sheets...");
    const client = await createSheetsClientFromEnv(logger);

    if (!client) {
      console.error("❌ Sheets-Client konnte nicht erstellt werden!");
      process.exit(1);
    }

    console.log("✅ Sheets-Client erstellt\n");

    // Test-Daten schreiben
    console.log("📝 Schreibe Test-Zeile...");
    const testOutput = {
      action: "withdraw" as const,
      item_name: "Test-Artikel",
      sku: "TEST-001",
      qty: 1,
      unit: "Stk" as const,
      location: "Regal Test",
      project_id: null,
      project_label: null,
      reason: "Test-Verbindung",
      person: null,
      notes: "Automatischer Test",
      authorized: true,
      duplicate: false,
      chat_id: -5025798709,
      message_id: 999999,
      telegram_user_id: 6377811171,
      telegram_username: "test_user",
      request_id: "test-connection",
      timestamp_iso: new Date().toISOString(),
      confidence: 1.0,
      needs_clarification: false,
      clarifying_question: null,
      confirmation_text: "Test erfolgreich",
    };

    const result = await client.write(testOutput);

    if (result.success) {
      console.log("✅ Test-Zeile erfolgreich geschrieben!");
      console.log(`   Transaktionen-Worksheet: ${worksheetName}`);
      if (result.inventoryUpdated) {
        console.log(`   ✅ Bestand aktualisiert (neuer Bestand: ${result.newStock})`);
      }
      if (result.alertNeeded) {
        console.log(`   ⚠️  Alert: ${result.alertMessage}`);
      }
      console.log("");
      console.log("🔍 Prüfe jetzt dein Spreadsheet:");
      console.log(
        `   https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      );
    } else {
      console.error(`❌ Fehler beim Schreiben: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fehler:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes("Permission")) {
      console.error("");
      console.error("💡 Lösung:");
      console.error(
        "   Das Spreadsheet muss mit dieser E-Mail geteilt werden:"
      );
      console.error("   sheets-connector@warenlager.iam.gserviceaccount.com");
    }
    process.exit(1);
  }
}

testSheets();

