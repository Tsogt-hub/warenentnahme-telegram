#!/usr/bin/env node
/**
 * Debug-Script: Zeigt Inhalte des Transaktionen-Sheets
 */

import "dotenv/config";
import { google } from "googleapis";

async function debugTransaktionen() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const worksheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || "Transaktionen";
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!spreadsheetId || !serviceAccountKey) {
    console.error("❌ Fehlende ENV-Variablen");
    process.exit(1);
  }

  // Service Account Key laden
  let credentials: any;
  try {
    if (serviceAccountKey.startsWith("{")) {
      credentials = JSON.parse(serviceAccountKey);
    } else if (!serviceAccountKey.includes("/") && serviceAccountKey.length > 100) {
      const decoded = Buffer.from(serviceAccountKey, "base64").toString("utf-8");
      credentials = JSON.parse(decoded);
    } else {
      const fs = await import("fs/promises");
      const path = await import("path");
      const resolvedPath = path.isAbsolute(serviceAccountKey)
        ? serviceAccountKey
        : path.resolve(process.cwd(), serviceAccountKey);
      const content = await fs.readFile(resolvedPath, "utf-8");
      credentials = JSON.parse(content);
    }
  } catch (error) {
    console.error("❌ Fehler beim Laden des Service Account Keys:", error);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    console.log(`\n🔍 Debug: Transaktionen-Sheet "${worksheetName}"\n`);

    // Lese alle Daten
    const range = `${worksheetName}!A:U`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      console.log("⚠️ Sheet ist leer!\n");
      console.log("💡 Die Transaktionen werden beim ersten Schreibvorgang angehängt.\n");
      return;
    }

    // Header
    const headers = rows[0];
    console.log("📋 Header:", headers);
    console.log(`\n📦 Anzahl Zeilen: ${rows.length} (inkl. Header)\n`);

    // Zeige letzte 10 Zeilen
    const showRows = Math.min(rows.length, 11); // Header + 10 Zeilen
    const startRow = Math.max(1, rows.length - 10);
    
    console.log(`📊 Letzte ${Math.min(10, rows.length - 1)} Transaktionen:\n`);
    
    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Zeile ${i + 1}:`, row);
    }

    if (rows.length > 11) {
      console.log(`\n... und ${startRow - 1} weitere Zeilen oben\n`);
    }

    // Prüfe auf Leer-Zeilen
    let emptyRows = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((cell: any) => !cell || cell.toString().trim() === "")) {
        emptyRows++;
      }
    }
    if (emptyRows > 0) {
      console.log(`⚠️ ${emptyRows} leere Zeilen gefunden\n`);
    }

  } catch (error: any) {
    if (error.message?.includes("Unable to parse range")) {
      console.error("❌ Fehler: Worksheet-Name nicht gefunden oder falsch");
      console.error(`   Gesuchter Name: "${worksheetName}"`);
      console.error("\n💡 Prüfe den genauen Namen im Spreadsheet (Groß-/Kleinschreibung beachten!)");
    } else {
      console.error("❌ Fehler:", error.message || error);
    }
    process.exit(1);
  }
}

debugTransaktionen();

