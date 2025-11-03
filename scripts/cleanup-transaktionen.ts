#!/usr/bin/env node
/**
 * Cleanup-Script: Räumt das Transaktionen-Sheet auf
 * Entfernt leere Spalten am Ende und formatiert die Tabelle
 */

import "dotenv/config";
import { google } from "googleapis";

async function cleanupTransaktionen() {
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
    console.log(`\n🧹 Räume Transaktionen-Sheet "${worksheetName}" auf...\n`);

    // Hole Sheet-ID
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheet = sheetMetadata.data.sheets?.find(
      (s) => s.properties?.title === worksheetName
    );
    
    if (!sheet?.properties?.sheetId) {
      console.error(`❌ Worksheet "${worksheetName}" nicht gefunden`);
      process.exit(1);
    }
    
    const sheetId = sheet.properties.sheetId;

    // Lese alle Daten
    const range = `${worksheetName}!A:Z`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      console.log("⚠️ Sheet ist leer - nichts zu bereinigen\n");
      return;
    }

    console.log(`📊 Gefundene Zeilen: ${rows.length}\n`);

    // Header definieren (20 Spalten)
    const headerRow = [
      "Timestamp",
      "Aktion",
      "Artikelname",
      "SKU",
      "Menge",
      "Einheit",
      "Lagerort",
      "Projekt-ID",
      "Projekt-Label",
      "Grund",
      "Person",
      "Notizen",
      "Confidence",
      "Klärung nötig",
      "Klärungsfrage",
      "Telegram User-ID",
      "Telegram Username",
      "Request-ID",
      "Duplikat",
      "Autorisiert",
    ];

    // Bereinige jede Datenzeile auf genau 20 Spalten
    const cleanedRows = [];
    
    // Header setzen
    cleanedRows.push(headerRow);
    
    // Datenzeilen bereinigen (ab Zeile 2)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      // Nimm nur die ersten 20 Spalten und fülle mit Leerstrings falls nötig
      const cleanedRow = Array.from({ length: 20 }, (_, idx) => {
        return row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
      });
      
      // Prüfe ob Zeile leer ist
      const isEmpty = cleanedRow.every((cell) => cell === "");
      if (!isEmpty) {
        cleanedRows.push(cleanedRow);
      }
    }

    console.log(`✅ Bereinigte Zeilen: ${cleanedRows.length - 1} (${cleanedRows.length - 1} Datenzeilen)\n`);

    // Lösche alle Daten im Sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${worksheetName}!A:Z`,
    });

    // Schreibe bereinigte Daten zurück
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${worksheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: cleanedRows,
      },
    });

    // Formatiere Header
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 20,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                  },
                  horizontalAlignment: "CENTER",
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
            },
          },
          // Auto-Resize Spalten
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: 20,
              },
            },
          },
        ],
      },
    });

    console.log("✅ Sheet aufgeräumt und formatiert!");
    console.log(`   - ${cleanedRows.length - 1} Datenzeilen bereinigt`);
    console.log(`   - Header formatiert (fett, blau, zentriert)`);
    console.log(`   - Spaltenbreiten automatisch angepasst`);
    console.log(`   - Leere Spalten entfernt\n`);
  } catch (error: any) {
    console.error("❌ Fehler:", error.message || error);
    process.exit(1);
  }
}

cleanupTransaktionen();

