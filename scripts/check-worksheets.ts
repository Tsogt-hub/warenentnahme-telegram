#!/usr/bin/env node
/**
 * Prüft welche Worksheets im Spreadsheet existieren
 */

import "dotenv/config";
import { google } from "googleapis";
import { readFile } from "fs/promises";

const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "./service-account-key.json";

if (!spreadsheetId) {
  console.error("❌ GOOGLE_SHEETS_SPREADSHEET_ID fehlt");
  process.exit(1);
}

async function checkWorksheets() {
  try {
    // Service Account Key laden
    const keyContent = await readFile(serviceAccountKeyPath, "utf-8");
    const credentials = JSON.parse(keyContent);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Alle Worksheets abrufen
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log("📋 Worksheets im Spreadsheet:\n");

    const worksheets = response.data.sheets || [];
    worksheets.forEach((sheet, index) => {
      const properties = sheet.properties;
      console.log(`${index + 1}. "${properties?.title}"`);
      console.log(`   ID: ${properties?.sheetId}`);
      console.log(`   Zeilen: ${properties?.gridProperties?.rowCount || "?"}`);
      console.log(`   Spalten: ${properties?.gridProperties?.columnCount || "?"}`);
      console.log("");
    });

    // Prüfe ob erwartete Worksheets existieren
    const expectedSheets = [
      process.env.GOOGLE_SHEETS_WORKSHEET_NAME || "Transaktionen",
      process.env.GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME || "Lagerbestand",
    ];

    console.log("🔍 Erwartete Worksheets:");
    expectedSheets.forEach((name) => {
      const exists = worksheets.some((s) => s.properties?.title === name);
      if (exists) {
        console.log(`   ✅ "${name}" existiert`);
      } else {
        console.log(`   ❌ "${name}" existiert NICHT`);
        console.log(`      → Wird beim ersten Schreibvorgang erstellt`);
      }
    });

    console.log("");
    console.log("💡 Falls andere Namen verwendet werden:");
    console.log("   Setze in .env:");
    console.log(`   GOOGLE_SHEETS_WORKSHEET_NAME=<tatsächlicher_name>`);
    console.log(`   GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME=<tatsächlicher_name>`);
  } catch (error) {
    console.error("❌ Fehler:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes("Permission")) {
      console.error("");
      console.error("💡 Spreadsheet muss mit Service Account geteilt werden:");
      console.error("   sheets-connector@warenlager.iam.gserviceaccount.com");
    }
    process.exit(1);
  }
}

checkWorksheets();

