#!/usr/bin/env tsx
/**
 * Prüft ob Transaktionen in Google Sheets geschrieben wurden
 * 
 * Usage:
 *   pnpm tsx scripts/check-sheets-transactions.ts
 */

import "dotenv/config";
import { google } from "googleapis";
import { getSheetsClient } from "../src/adapters/sheets.js";

async function checkTransactions() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const worksheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || "Transaktionen";
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!spreadsheetId || !serviceAccountKey) {
    console.error("❌ ENV-Variablen fehlen:");
    console.error(`   GOOGLE_SHEETS_SPREADSHEET_ID: ${spreadsheetId ? "✅" : "❌"}`);
    console.error(`   GOOGLE_SERVICE_ACCOUNT_KEY: ${serviceAccountKey ? "✅" : "❌"}`);
    process.exit(1);
  }

  console.log("🔍 Prüfe Google Sheets...");
  console.log(`   Spreadsheet-ID: ${spreadsheetId}`);
  console.log(`   Worksheet-Name: ${worksheetName}`);
  console.log("");

  try {
    // Sheets-Client erstellen
    const sheets = await getSheetsClient(serviceAccountKey);

    // Prüfe ob Spreadsheet existiert
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log(`✅ Spreadsheet gefunden: "${spreadsheet.data.properties?.title}"`);
    console.log("");

    // Liste alle Worksheets
    const worksheets = spreadsheet.data.sheets || [];
    console.log("📋 Verfügbare Worksheets:");
    worksheets.forEach((sheet) => {
      const title = sheet.properties?.title;
      const isTarget = title === worksheetName;
      console.log(`   ${isTarget ? "✅" : "  "} "${title}"${isTarget ? " (Ziel)" : ""}`);
    });
    console.log("");

    // Prüfe ob Ziel-Worksheet existiert
    const targetSheet = worksheets.find((s) => s.properties?.title === worksheetName);
    if (!targetSheet) {
      console.error(`❌ Worksheet "${worksheetName}" nicht gefunden!`);
      console.error("");
      console.error("💡 Lösung:");
      console.error(`   1. Erstelle Tab "${worksheetName}" im Spreadsheet`);
      console.error(`   2. Oder: Ändere GOOGLE_SHEETS_WORKSHEET_NAME`);
      process.exit(1);
    }

    // Lese alle Zeilen
    const range = `${worksheetName}!A:T`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    console.log(`📊 Zeilen in "${worksheetName}": ${rows.length}`);
    console.log("");

    if (rows.length === 0) {
      console.log("⚠️  Worksheet ist leer");
      console.log("   Bot erstellt Header automatisch beim ersten Schreiben");
    } else {
      // Zeige Header
      const header = rows[0];
      console.log("📋 Header (Zeile 1):");
      console.log(`   ${header.slice(0, 10).join(" | ")}...`);
      console.log("");

      // Zeige letzte 5 Zeilen
      const lastRows = rows.slice(-5);
      console.log("📋 Letzte 5 Zeilen:");
      lastRows.forEach((row, idx) => {
        const rowNum = rows.length - lastRows.length + idx + 1;
        const preview = row.slice(0, 5).join(" | ");
        console.log(`   Zeile ${rowNum}: ${preview}${row.length > 5 ? "..." : ""}`);
      });
      console.log("");

      // Prüfe nach leeren Zeilen
      const emptyRows = rows
        .map((row, idx) => ({ row: idx + 1, isEmpty: !row || row.every((cell) => !cell || String(cell).trim() === "") }))
        .filter((r) => r.isEmpty);

      if (emptyRows.length > 0) {
        console.log(`⚠️  ${emptyRows.length} leere Zeile(n) gefunden (Bot könnte dort schreiben):`);
        emptyRows.forEach((r) => console.log(`   Zeile ${r.row}`));
        console.log("");
      }
    }

    // Prüfe Timestamp der letzten Transaktion
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      const timestampIndex = 0; // Timestamp ist erste Spalte
      if (lastRow[timestampIndex]) {
        console.log(`🕐 Letzte Transaktion: ${lastRow[timestampIndex]}`);
        console.log("");
      }
    }

    console.log("✅ Prüfung abgeschlossen!");
  } catch (error) {
    console.error("❌ Fehler:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

checkTransactions();

