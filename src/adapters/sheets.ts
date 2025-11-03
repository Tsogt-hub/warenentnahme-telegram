import { google } from "googleapis";
import type { ParserOutput } from "../schema.js";
import type { Logger } from "pino";

interface SheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  serviceAccountKey: string; // Base64 encoded JSON oder Pfad zur Datei
  inventoryWorksheetName?: string; // Worksheet für Lagerbestand (optional)
  alertThreshold?: number; // Meldebestand-Schwelle (optional)
}

interface InventoryItem {
  sku?: string;
  itemName?: string;
  currentStock: number;
  unit: string;
  location?: string;
  alertThreshold?: number;
}

interface SheetsWriteResult {
  success: boolean;
  error?: string;
  inventoryUpdated?: boolean;
  newStock?: number;
  alertNeeded?: boolean;
  alertMessage?: string;
}

/**
 * Initialisiert Google Sheets API Client
 */
async function getSheetsClient(serviceAccountKey: string) {
  let credentials: any;

  try {
    // Versuche als Base64 encoded JSON zu dekodieren
    if (serviceAccountKey.startsWith("{")) {
      // Direkt JSON-String
      credentials = JSON.parse(serviceAccountKey);
    } else if (!serviceAccountKey.includes("/") && serviceAccountKey.length > 100) {
      // Base64 encoded
      const decoded = Buffer.from(serviceAccountKey, "base64").toString("utf-8");
      credentials = JSON.parse(decoded);
    } else {
      // Pfad zur JSON-Datei
      const fs = await import("fs/promises");
      const path = await import("path");
      const resolvedPath = path.isAbsolute(serviceAccountKey) 
        ? serviceAccountKey 
        : path.resolve(process.cwd(), serviceAccountKey);
      
      try {
        const content = await fs.readFile(resolvedPath, "utf-8");
        credentials = JSON.parse(content);
      } catch (fileError) {
        throw new Error(
          `Service Account Key Datei nicht gefunden: ${resolvedPath}. Fehler: ${String(fileError)}`
        );
      }
    }
  } catch (error) {
    throw new Error(`Ungültiges Service Account Key Format: ${String(error)}`);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Formatiert Timestamp für Sheets
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Konvertiert Parser-Output zu Sheets-Zeile
 */
function outputToRow(output: ParserOutput): string[] {
  return [
    formatTimestamp(output.timestamp_iso), // Timestamp
    output.action, // Aktion
    output.item_name || "", // Artikelname
    output.sku || "", // SKU
    output.qty !== null && output.qty !== undefined ? String(output.qty) : "", // Menge (leer wenn null)
    output.unit || "Stk", // Einheit (Default "Stk" wenn null)
    output.location || "", // Lagerort
    output.project_id || "", // Projekt-ID
    output.project_label || "", // Projekt-Label
    output.reason || "", // Grund
    output.person || "", // Person
    output.notes || "", // Notizen
    String(output.confidence), // Confidence
    output.needs_clarification ? "Ja" : "Nein", // Klärung nötig?
    output.clarifying_question || "", // Klärungsfrage
    output.telegram_user_id.toString(), // Telegram User-ID
    output.telegram_username || "", // Telegram Username
    output.request_id, // Request-ID
    output.duplicate ? "Ja" : "Nein", // Duplikat?
    output.authorized ? "Ja" : "Nein", // Autorisiert?
  ];
}

/**
 * Liest Lagerbestand aus Google Sheets
 */
async function readInventory(
  sheets: any,
  spreadsheetId: string,
  inventoryWorksheetName: string,
  skuOrName: string,
  logger?: Logger
): Promise<InventoryItem | null> {
  try {
    const range = `${inventoryWorksheetName}!A:E`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return null;
    }

    // Erste Zeile sind Header, danach Daten
    const headers = rows[0];
    
    // Flexibles Header-Matching (unterstützt verschiedene Spaltennamen)
    function findHeaderIndex(possibleNames: string[]): number {
      for (const name of possibleNames) {
        const index = headers.findIndex((h: string) => {
          const trimmed = (h || "").toString().trim();
          return trimmed.toLowerCase() === name.toLowerCase();
        });
        if (index >= 0) return index;
      }
      // Fallback: Suche nach Teilstring
      for (const name of possibleNames) {
        const index = headers.findIndex((h: string) => {
          const trimmed = (h || "").toString().trim().toLowerCase();
          return trimmed.includes(name.toLowerCase()) || name.toLowerCase().includes(trimmed);
        });
        if (index >= 0) return index;
      }
      return -1;
    }

    const skuIndex = findHeaderIndex(["Artikel-Nr", "SKU", "Artikelnummer", "Art-Nr"]);
    const nameIndex = findHeaderIndex(["Bezeichnung", "Artikelname", "Artikel", "Name"]);
    const stockIndex = findHeaderIndex(["Aktueller Bestand", "Bestand", "Menge", "Stock"]);
    const unitIndex = findHeaderIndex(["Einheit", "Unit", "UOM"]);
    const locationIndex = findHeaderIndex(["Lagerort", "Location", "Ort"]);
    const thresholdIndex = findHeaderIndex(["Meldebestand", "Mindestbestand", "Reorder Point", "Alert Threshold"]);

    // Suche nach SKU oder Artikelname (exakt oder teilweise)
    const searchLower = skuOrName.toLowerCase().trim();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = skuIndex >= 0 ? (row[skuIndex] || "").toString().trim() : "";
      const name = nameIndex >= 0 ? (row[nameIndex] || "").toString().trim() : "";

      // Exakter Match (SKU oder Name)
      if (
        sku?.toLowerCase() === searchLower ||
        name?.toLowerCase() === searchLower
      ) {
        logger?.info({ found: "exact", sku, name, searchTerm: skuOrName }, "Artikel gefunden (exakt)");
        return {
          sku: sku || undefined,
          itemName: name || undefined,
          currentStock: Number(row[stockIndex] || 0),
          unit: row[unitIndex] || "Stk",
          location: locationIndex >= 0 ? row[locationIndex] : undefined,
          alertThreshold: thresholdIndex >= 0 ? Number(row[thresholdIndex] || 0) : undefined,
        };
      }
      
      // Teilstring-Match (wenn Name im Suchbegriff enthalten oder umgekehrt)
      if (
        name &&
        (name.toLowerCase().includes(searchLower) || searchLower.includes(name.toLowerCase()))
      ) {
        logger?.info({ found: "partial", name, searchTerm: skuOrName }, "Artikel gefunden (teilweise)");
        return {
          sku: sku || undefined,
          itemName: name || undefined,
          currentStock: Number(row[stockIndex] || 0),
          unit: row[unitIndex] || "Stk",
          location: locationIndex >= 0 ? row[locationIndex] : undefined,
          alertThreshold: thresholdIndex >= 0 ? Number(row[thresholdIndex] || 0) : undefined,
        };
      }
    }
    
    logger?.warn({ searchTerm: skuOrName }, "Artikel nicht im Lagerbestand gefunden");

    return null;
  } catch (error) {
    logger?.error({ error }, "Fehler beim Lesen des Lagerbestands");
    return null;
  }
}

/**
 * Aktualisiert Lagerbestand in Google Sheets
 */
async function updateInventory(
  sheets: any,
  spreadsheetId: string,
  inventoryWorksheetName: string,
  skuOrName: string,
  quantityChange: number,
  logger?: Logger
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  try {
    const range = `${inventoryWorksheetName}!A:E`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      // Erstelle Header wenn Sheet leer
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${inventoryWorksheetName}!A1:F1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["SKU", "Artikelname", "Bestand", "Einheit", "Lagerort", "Meldebestand"]],
        },
      });
      logger?.info("Lagerbestand-Sheet: Header erstellt");
      return { success: false, error: "Artikel nicht gefunden" };
    }

    const headers = rows[0];
    
    // Flexibles Header-Matching (unterstützt verschiedene Spaltennamen)
    function findHeaderIndex(possibleNames: string[]): number {
      for (const name of possibleNames) {
        const index = headers.findIndex((h: string) => {
          const trimmed = (h || "").toString().trim();
          return trimmed.toLowerCase() === name.toLowerCase();
        });
        if (index >= 0) return index;
      }
      // Fallback: Suche nach Teilstring
      for (const name of possibleNames) {
        const index = headers.findIndex((h: string) => {
          const trimmed = (h || "").toString().trim().toLowerCase();
          return trimmed.includes(name.toLowerCase()) || name.toLowerCase().includes(trimmed);
        });
        if (index >= 0) return index;
      }
      return -1;
    }

    const skuIndex = findHeaderIndex(["Artikel-Nr", "SKU", "Artikelnummer", "Art-Nr"]);
    const nameIndex = findHeaderIndex(["Bezeichnung", "Artikelname", "Artikel", "Name"]);
    const stockIndex = findHeaderIndex(["Aktueller Bestand", "Bestand", "Menge", "Stock"]);
    const unitIndex = findHeaderIndex(["Einheit", "Unit", "UOM"]);

    // Suche Zeile (exakt oder teilweise)
    let rowIndex = -1;
    const searchLower = skuOrName.toLowerCase().trim();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = skuIndex >= 0 ? (row[skuIndex] || "").toString().trim() : "";
      const name = nameIndex >= 0 ? (row[nameIndex] || "").toString().trim() : "";

      // Exakter Match
      if (
        sku?.toLowerCase() === searchLower ||
        name?.toLowerCase() === searchLower
      ) {
        rowIndex = i + 1; // +1 weil Sheets 1-basiert ist
        logger?.info({ found: "exact", sku, name, searchTerm: skuOrName }, "Artikel für Update gefunden (exakt)");
        break;
      }
      
      // Teilstring-Match
      if (
        name &&
        (name.toLowerCase().includes(searchLower) || searchLower.includes(name.toLowerCase()))
      ) {
        rowIndex = i + 1;
        logger?.info({ found: "partial", name, searchTerm: skuOrName }, "Artikel für Update gefunden (teilweise)");
        break;
      }
    }

    if (rowIndex === -1) {
      logger?.warn({ searchTerm: skuOrName }, "Artikel nicht im Lagerbestand gefunden");
      
      // OPTION 1: Artikel automatisch anlegen (mit Bestand 0)
      // Wenn Entnahme: Fehler (kein negativer Bestand möglich)
      // Wenn Rückgabe: Artikel anlegen mit Menge als Bestand
      
      if (quantityChange > 0) {
        // Rückgabe/Eingang: Artikel automatisch anlegen
        logger?.info({ searchTerm: skuOrName, initialStock: quantityChange }, "Lege neuen Artikel im Bestand an");
        
        // Finde nächste leere Zeile
        const nextRowIndex = rows.length + 1;
        
        // Erstelle neue Zeile (SKU, Artikelname, Bestand, Einheit)
        const newRow: any[] = [];
        
        // Setze Werte basierend auf Spalten-Index
        for (let col = 0; col < Math.max(skuIndex, nameIndex, stockIndex, unitIndex) + 1; col++) {
          if (col === skuIndex) {
            newRow[col] = ""; // SKU leer lassen wenn nicht vorhanden
          } else if (col === nameIndex) {
            newRow[col] = skuOrName; // Artikelname
          } else if (col === stockIndex) {
            newRow[col] = String(quantityChange); // Initialer Bestand
          } else if (col === unitIndex) {
            newRow[col] = "Stk"; // Default Einheit
          } else {
            newRow[col] = "";
          }
        }
        
        // Schreibe neue Zeile
        const insertRange = `${inventoryWorksheetName}!A${nextRowIndex}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: insertRange,
          valueInputOption: "RAW",
          requestBody: {
            values: [newRow],
          },
        });
        
        logger?.info({ searchTerm: skuOrName, row: nextRowIndex }, "Neuer Artikel im Bestand angelegt");
        return { success: true, newStock: quantityChange };
      } else {
        // Entnahme: Artikel nicht vorhanden - Fehler
        logger?.warn({ searchTerm: skuOrName }, "Artikel nicht im Lagerbestand - Entnahme nicht möglich");
        return { 
          success: false, 
          error: `Artikel "${skuOrName}" nicht im Lagerbestand gefunden. Bitte zuerst Artikel anlegen.` 
        };
      }
    }

    // Aktuellen Bestand lesen
    const currentStock = Number(rows[rowIndex - 1][stockIndex] || 0);
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      return {
        success: false,
        error: `Nicht genug Bestand. Verfügbar: ${currentStock}, Benötigt: ${Math.abs(quantityChange)}`,
        newStock: currentStock,
      };
    }

    // Bestand aktualisieren - verwende stockIndex statt hardcodiert C
    if (stockIndex < 0) {
      logger?.error({ headers }, "Spalte 'Aktueller Bestand' nicht gefunden!");
      return { success: false, error: "Spalte 'Aktueller Bestand' nicht im Sheet gefunden" };
    }
    
    // Konvertiere Index zu Spaltenbuchstabe (A=0, B=1, C=2, D=3, etc.)
    const columnLetter = String.fromCharCode(65 + stockIndex); // A=65 in ASCII
    const updateRange = `${inventoryWorksheetName}!${columnLetter}${rowIndex}`;
    
    logger?.info(
      { 
        updateRange, 
        stockIndex, 
        columnLetter, 
        rowIndex, 
        oldStock: currentStock, 
        newStock 
      },
      "Aktualisiere Bestandsspalte"
    );
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [[String(newStock)]],
      },
    });

    logger?.info(
      { skuOrName, oldStock: currentStock, newStock, change: quantityChange },
      "Lagerbestand aktualisiert"
    );

    return { success: true, newStock };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMessage }, "Fehler beim Aktualisieren des Lagerbestands");
    return { success: false, error: errorMessage };
  }
}

/**
 * Schreibt Lagerbewegung in Google Sheets und aktualisiert Bestand
 */
export async function writeToSheets(
  output: ParserOutput,
  config: SheetsConfig,
  logger?: Logger
): Promise<SheetsWriteResult> {
  try {
    logger?.debug({ config: { ...config, serviceAccountKey: "***" } }, "Sheets adapter: Start");
    logger?.info(
      {
        action: output.action,
        item: output.item_name,
        sku: output.sku,
        qty: output.qty,
        authorized: output.authorized,
        duplicate: output.duplicate,
      },
      "Sheets adapter: Verarbeite Output"
    );

    // Nur autorisierte und nicht-duplizierte Requests schreiben
    if (!output.authorized || output.duplicate) {
      logger?.debug(
        { authorized: output.authorized, duplicate: output.duplicate },
        "Sheets adapter: Übersprungen (nicht autorisiert oder Duplikat)"
      );
      return { success: true };
    }

    logger?.info("Sheets adapter: Initialisiere Sheets-Client...");
    const sheets = await getSheetsClient(config.serviceAccountKey);
    logger?.info("Sheets adapter: Sheets-Client erstellt");
    const inventoryWorksheetName = config.inventoryWorksheetName || "Lagerbestand";
    const alertThreshold = config.alertThreshold;

    // Bestand aktualisieren (falls SKU oder Artikelname vorhanden)
    let inventoryUpdateResult:
      | { success: boolean; newStock?: number; error?: string }
      | undefined;
    let alertNeeded = false;
    let alertMessage = "";

    if (output.sku || output.item_name) {
      // Priorisiere item_name über SKU für besseres Matching
      const searchTerm = output.item_name || output.sku || "";
      let quantityChange = 0;

      logger?.info(
        { searchTerm, hasSku: !!output.sku, hasItemName: !!output.item_name, qty: output.qty },
        "Versuche Lagerbestand zu aktualisieren"
      );

      // Menge basierend auf Aktion bestimmen
      // Prüfe ob qty vorhanden (kann null sein bei unklarer Menge)
      if (output.qty === null || output.qty === undefined) {
        logger?.warn({ action: output.action }, "Menge unklar - Bestand wird nicht aktualisiert");
        // Bestand nicht aktualisieren wenn Menge unklar
      } else if (output.action === "withdraw") {
        quantityChange = -output.qty;
      } else if (output.action === "return") {
        quantityChange = output.qty;
      } else if (output.action === "adjust") {
        // Bei adjust muss der neue Bestand gesetzt werden (nicht geändert)
        // Für jetzt: als Änderung behandeln
        quantityChange = output.qty - 0; // TODO: Aktuellen Bestand lesen und Differenz berechnen
      }

      if (quantityChange !== 0) {
        inventoryUpdateResult = await updateInventory(
          sheets,
          config.spreadsheetId,
          inventoryWorksheetName,
          searchTerm,
          quantityChange,
          logger
        );
        
        logger?.info(
          { 
            inventoryUpdateSuccess: inventoryUpdateResult.success,
            error: inventoryUpdateResult.error,
            newStock: inventoryUpdateResult.newStock
          },
          "Lagerbestand-Update Ergebnis"
        );

        // Meldebestand prüfen
        if (inventoryUpdateResult.success && inventoryUpdateResult.newStock !== undefined) {
          const inventory = await readInventory(
            sheets,
            config.spreadsheetId,
            inventoryWorksheetName,
            searchTerm,
            logger
          );

          const threshold = inventory?.alertThreshold || alertThreshold || 0;
          if (threshold > 0 && inventoryUpdateResult.newStock <= threshold) {
            alertNeeded = true;
            alertMessage = `⚠️ Niedriger Bestand: ${output.item_name || output.sku} - ${inventoryUpdateResult.newStock} ${output.unit} (Meldebestand: ${threshold})`;
            logger?.warn(
              {
                item: output.item_name || output.sku,
                stock: inventoryUpdateResult.newStock,
                threshold,
              },
              "Meldebestand unterschritten"
            );
          }
        }
      }
    }

    // Header-Zeile prüfen/erstellen
    const range = `${config.worksheetName}!A1:Z1`; // Erweitert auf Z für mehr Spalten
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range,
    });

    const existingHeaders = headerResponse.data.values?.[0] || [];
    const hasHeaders = existingHeaders.length > 0;
    
    // Prüfe ob unser Standard-Header vorhanden ist (anhand von "Aktion" und "Artikelname")
    const hasOurHeader = hasHeaders && (
      existingHeaders.includes("Aktion") || 
      existingHeaders.includes("Artikelname") ||
      existingHeaders.some((h: string) => h?.toLowerCase().includes("artikelname"))
    );
    
    if (!hasOurHeader) {
      // Wenn Header existiert, aber nicht unser Standard ist, oder wenn leer
      // Erstelle/ersetze mit unserem Standard-Header
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

      // Setze Header und formatiere Spalten
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${config.worksheetName}!A1:T1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [headerRow],
        },
      });
      
      // Formatiere Header-Zeile (fett, zentriert)
      try {
        const sheetMetadata = await sheets.spreadsheets.get({
          spreadsheetId: config.spreadsheetId,
        });
        const sheetId = sheetMetadata.data.sheets?.find(
          (s) => s.properties?.title === config.worksheetName
        )?.properties?.sheetId;
        
        if (sheetId !== undefined) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: config.spreadsheetId,
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
          
          logger?.info("Sheets adapter: Header formatiert und Spaltenbreiten angepasst");
        }
      } catch (formatError) {
        logger?.warn({ error: formatError }, "Fehler bei Formatierung - ignoriert");
      }

      logger?.info(
        { existingHeaders: existingHeaders.slice(0, 5), replaced: true },
        "Sheets adapter: Header-Zeile erstellt/ersetzt"
      );
    } else {
      logger?.debug({ headers: existingHeaders.slice(0, 5) }, "Sheets adapter: Standard-Header bereits vorhanden");
    }

    // Daten-Zeile anhängen
    logger?.info("Sheets adapter: Schreibe Transaktion in Worksheet...");
    const row = outputToRow(output);
    
    // Verwende A:A für append (fügt automatisch in erste leere Zeile)
    // ACHTUNG: append() mit A:A fügt nur in Spalte A ein!
    // Wir müssen A:U verwenden, um alle Spalten zu füllen
    const appendRange = `${config.worksheetName}!A1:U1`; // Startet bei Zeile 1, append findet erste leere Zeile
    
    logger?.debug(
      { 
        worksheetName: config.worksheetName,
        appendRange,
        rowLength: row.length,
        rowPreview: row.slice(0, 5),
        fullRow: row
      },
      "Füge Transaktionszeile hinzu"
    );

    try {
      // Finde die nächste leere Zeile
      const checkRange = `${config.worksheetName}!A:A`;
      const checkResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: checkRange,
      });
      
      const allRows = checkResponse.data.values || [];
      let nextRowIndex = allRows.length + 1; // Nächste Zeile nach allen vorhandenen
      
      // Suche nach erster wirklich leerer Zeile
      // Starte ab Zeile 2 (nach Header), überspringe Header
      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        if (!row || row.length === 0 || row.every((cell: any) => !cell || cell.toString().trim() === "")) {
          nextRowIndex = i + 1; // Zeilen-Index ist 1-basiert
          break;
        }
      }
      
      // Falls keine leere Zeile gefunden, nimm die nächste nach allen vorhandenen
      if (nextRowIndex > allRows.length) {
        nextRowIndex = allRows.length + 1;
      }
      
      logger?.debug(
        { nextRowIndex, totalRows: allRows.length, searchedRows: allRows.length - 1 },
        "Gefundene nächste Zeile für Transaktion"
      );
      
      // Schreibe direkt in die nächste Zeile - genau 20 Spalten (A bis T)
      // Stelle sicher, dass das Array genau 20 Elemente hat
      const rowWithExactColumns = [...row];
      while (rowWithExactColumns.length < 20) {
        rowWithExactColumns.push(""); // Fülle fehlende Spalten mit Leerstring
      }
      // Begrenze auf genau 20 Spalten (falls mehr)
      const finalRow = rowWithExactColumns.slice(0, 20);
      
      const writeRange = `${config.worksheetName}!A${nextRowIndex}:T${nextRowIndex}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: writeRange,
        valueInputOption: "RAW",
        requestBody: {
          values: [finalRow],
        },
      });
      
      logger?.debug(
        { 
          writeRange,
          rowIndex: nextRowIndex
        },
        "Transaktion geschrieben"
      );

      logger?.info(
        {
          action: output.action,
          item: output.item_name,
          requestId: output.request_id,
          inventoryUpdated: inventoryUpdateResult?.success,
        },
        "Sheets adapter: Zeile erfolgreich hinzugefügt"
      );
    } catch (appendError) {
      const errorMsg = appendError instanceof Error ? appendError.message : String(appendError);
      logger?.error(
        { error: errorMsg, appendRange, spreadsheetId: config.spreadsheetId },
        "Fehler beim Anhängen der Zeile"
      );
      throw new Error(`Fehler beim Schreiben in Worksheet "${config.worksheetName}": ${errorMsg}`);
    }

    return {
      success: true,
      inventoryUpdated: inventoryUpdateResult?.success,
      newStock: inventoryUpdateResult?.newStock,
      alertNeeded,
      alertMessage: alertNeeded ? alertMessage : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMessage }, "Sheets adapter: Fehler");

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Erstellt Sheets-Client mit Config aus ENV
 */
export async function createSheetsClientFromEnv(logger?: Logger): Promise<{
  write: (output: ParserOutput) => Promise<SheetsWriteResult>;
} | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const worksheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || "Transaktionen";
  const inventoryWorksheetName =
    process.env.GOOGLE_SHEETS_INVENTORY_WORKSHEET_NAME || "Lagerbestand";
  const alertThreshold = process.env.GOOGLE_SHEETS_ALERT_THRESHOLD
    ? Number(process.env.GOOGLE_SHEETS_ALERT_THRESHOLD)
    : undefined;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!spreadsheetId || !serviceAccountKey) {
    logger?.warn("Google Sheets Config unvollständig - Adapter deaktiviert");
    return null;
  }

  return {
    write: (output: ParserOutput) =>
      writeToSheets(
        output,
        {
          spreadsheetId,
          worksheetName,
          inventoryWorksheetName,
          alertThreshold,
          serviceAccountKey,
        },
        logger
      ),
  };
}
