#!/usr/bin/env node
/**
 * Debug-Script: Zeigt Inhalte des Lagerbestand-Sheets
 */

import "dotenv/config";
import { google } from "googleapis";

async function debugInventory() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const inventoryWorksheetName = process.env.GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME || "Lagerbestand";
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
    console.log(`\n🔍 Debug: Lagerbestand-Sheet "${inventoryWorksheetName}"\n`);

    // Lese alle Daten
    const range = `${inventoryWorksheetName}!A:Z`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      console.log("⚠️ Sheet ist leer!\n");
      return;
    }

    // Header
    const headers = rows[0];
    console.log("📋 Header:", headers);
    console.log("\n📦 Artikel im Lagerbestand:\n");

    const skuIndex = headers.indexOf("SKU");
    const nameIndex = headers.indexOf("Artikelname");
    const stockIndex = headers.indexOf("Bestand");
    const unitIndex = headers.indexOf("Einheit");

    console.log("Index-Positionen:");
    console.log(`  SKU: Spalte ${skuIndex >= 0 ? String.fromCharCode(65 + skuIndex) : "NICHT GEFUNDEN"}`);
    console.log(`  Artikelname: Spalte ${nameIndex >= 0 ? String.fromCharCode(65 + nameIndex) : "NICHT GEFUNDEN"}`);
    console.log(`  Bestand: Spalte ${stockIndex >= 0 ? String.fromCharCode(65 + stockIndex) : "NICHT GEFUNDEN"}`);
    console.log(`  Einheit: Spalte ${unitIndex >= 0 ? String.fromCharCode(65 + unitIndex) : "NICHT GEFUNDEN"}\n`);

    // Zeige erste 20 Artikel
    const maxRows = Math.min(rows.length, 21); // Header + 20 Zeilen
    for (let i = 1; i < maxRows; i++) {
      const row = rows[i];
      const sku = skuIndex >= 0 ? (row[skuIndex] || "").toString().trim() : "";
      const name = nameIndex >= 0 ? (row[nameIndex] || "").toString().trim() : "";
      const stock = stockIndex >= 0 ? (row[stockIndex] || "").toString().trim() : "";
      const unit = unitIndex >= 0 ? (row[unitIndex] || "").toString().trim() : "";

      // Zeige komplette Zeile falls keine Spalten gefunden
      if (skuIndex < 0 || nameIndex < 0 || stockIndex < 0) {
        console.log(`${i}. Zeile:`, row);
      } else {
        console.log(`${i}. SKU: "${sku}" | Name: "${name}" | Bestand: "${stock}" ${unit}`);
      }

      // Teste Suche nach "Leiter"
      if (name && (name.toLowerCase().includes("leiter") || "leiter".includes(name.toLowerCase()))) {
        console.log(`   ⭐ KÖNNTE MATCHEN für "Leiter"`);
      }
    }

    if (rows.length > 21) {
      console.log(`\n... und ${rows.length - 21} weitere Artikel\n`);
    }

    // Teste explizite Suche
    console.log("\n🔎 Test-Suche für 'Leiter':");
    const searchTerm = "Leiter";
    const searchLower = searchTerm.toLowerCase().trim();
    let found = false;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = skuIndex >= 0 ? (row[skuIndex] || "").toString().trim() : "";
      const name = nameIndex >= 0 ? (row[nameIndex] || "").toString().trim() : "";

      if (
        sku?.toLowerCase() === searchLower ||
        name?.toLowerCase() === searchLower
      ) {
        console.log(`✅ Exakter Match gefunden: Zeile ${i + 1}, Name: "${name}"`);
        found = true;
        break;
      }

      if (
        name &&
        (name.toLowerCase().includes(searchLower) || searchLower.includes(name.toLowerCase()))
      ) {
        console.log(`✅ Teilstring-Match gefunden: Zeile ${i + 1}, Name: "${name}"`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`❌ Kein Match für "Leiter" gefunden`);
      console.log(`\n💡 Mögliche Probleme:`);
      console.log(`   - Artikel heißt anders im Sheet (z.B. "Leiter 3m", "Leitern", etc.)`);
      console.log(`   - Spalte "Artikelname" hat falschen Namen`);
      console.log(`   - Artikel existiert nicht im Sheet`);
    }
  } catch (error) {
    console.error("❌ Fehler:", error);
    process.exit(1);
  }
}

debugInventory();

