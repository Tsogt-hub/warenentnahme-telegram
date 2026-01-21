import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import type { ParserOutput } from "../schema.js";
import type { Logger } from "pino";

interface ExcelConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  // Benutzer-Principal-Name (E-Mail) des OneDrive-Besitzers
  userPrincipalName: string;
  // Pfad zur Excel-Datei in OneDrive (z.B. "/Lagerliste LGE_Neues Lager.xlsx")
  filePath: string;
  // Worksheet-Namen
  inventoryWorksheetName?: string; // Default: "Lagerliste"
  transactionsWorksheetName?: string; // Default: "Transaktionen"
}

interface ExcelWriteResult {
  success: boolean;
  error?: string;
  inventoryUpdated?: boolean;
  newStock?: number;
  alertNeeded?: boolean;
  alertMessage?: string;
}

interface InventoryItem {
  rowIndex: number;
  lagerplatzInnen?: string; // Spalte A
  lagerplatzAussen?: string; // Spalte B
  interneArtikelnummer?: string; // Spalte C
  externeArtikelnummer?: string; // Spalte D
  bezeichnung?: string; // Spalte E
  hersteller?: string; // Spalte F
  bestandInnen: number; // Spalte G
  bestandAussen: number; // Spalte H
  gesamtbestand: number; // Spalte I
}

/**
 * Erstellt Microsoft Graph Client mit Client Credentials
 */
function createGraphClient(config: ExcelConfig): Client {
  const credential = new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  return Client.initWithMiddleware({
    authProvider,
  });
}

/**
 * Formatiert Timestamp für Excel
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
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
 * Liest Lagerbestand aus Excel
 */
async function readInventory(
  client: Client,
  config: ExcelConfig,
  searchTerm: string,
  logger?: Logger
): Promise<InventoryItem | null> {
  try {
    const worksheetName = config.inventoryWorksheetName || "Lagerliste";
    
    // Lese alle Daten aus dem Worksheet
    const response = await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/usedRange`)
      .get();

    const rows = response.values || [];
    if (rows.length < 2) {
      logger?.warn("Keine Daten im Lagerbestand-Sheet gefunden");
      return null;
    }

    // Header ist Zeile 1 (Index 0), Daten beginnen ab Zeile 3 (Index 2)
    // Spaltenstruktur: A-F=Artikelinfo, G=Bestand Innen, H=Bestand Außen, I=Gesamtbestand
    let headerRowIndex = 0; // Zeile 1
    const dataStartRowIndex = 2; // Zeile 3 (0-basiert)
    
    // Versuche Header-Zeile zu finden falls anders strukturiert
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const row = rows[i];
      if (row && row.some((cell: string) => 
        cell && typeof cell === 'string' && 
        (cell.includes("Bezeichnung") || cell.includes("Bestand") || cell.includes("Artikelnummer") || cell.includes("Lagerplatz"))
      )) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rows[headerRowIndex];
    
    // Finde Spalten-Indizes
    const findColumnIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex((h: string) => 
          h && typeof h === 'string' && h.toLowerCase().includes(name.toLowerCase())
        );
        if (index >= 0) return index;
      }
      return -1;
    };

    const colBezeichnung = findColumnIndex(["Bezeichnung"]);
    const colInterneNr = findColumnIndex(["Interne", "Artikel-Nr", "Artikelnummer"]);
    const colExterneNr = findColumnIndex(["Externe"]);
    // Feste Spalten: G=Bestand Innen (Index 6), H=Bestand Außen (Index 7), I=Gesamtbestand (Index 8)
    const colBestandInnen = 6; // Spalte G
    const colBestandAussen = 7; // Spalte H
    const colGesamtbestand = 8; // Spalte I

    logger?.debug({
      headerRowIndex,
      colBezeichnung,
      colInterneNr,
      colBestandInnen,
      colBestandAussen,
    }, "Spalten-Mapping gefunden");

    // Suche nach Artikel (Daten beginnen ab Zeile 3 = Index 2)
    const searchLower = searchTerm.toLowerCase().trim();
    
    for (let i = dataStartRowIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const bezeichnung = colBezeichnung >= 0 ? String(row[colBezeichnung] || "").trim() : "";
      const interneNr = colInterneNr >= 0 ? String(row[colInterneNr] || "").trim() : "";
      const externeNr = colExterneNr >= 0 ? String(row[colExterneNr] || "").trim() : "";

      // Exakter oder Teil-Match
      if (
        bezeichnung.toLowerCase() === searchLower ||
        interneNr.toLowerCase() === searchLower ||
        externeNr.toLowerCase() === searchLower ||
        bezeichnung.toLowerCase().includes(searchLower) ||
        searchLower.includes(bezeichnung.toLowerCase())
      ) {
        logger?.info({ found: bezeichnung, row: i + 1 }, "Artikel gefunden");
        
        return {
          rowIndex: i,
          lagerplatzInnen: row[0] || undefined,
          lagerplatzAussen: row[1] || undefined,
          interneArtikelnummer: interneNr || undefined,
          externeArtikelnummer: externeNr || undefined,
          bezeichnung: bezeichnung || undefined,
          hersteller: row[5] || undefined,
          bestandInnen: Number(row[colBestandInnen] || 0),
          bestandAussen: Number(row[colBestandAussen] || 0),
          gesamtbestand: Number(row[colGesamtbestand] || 0),
        };
      }
    }

    logger?.warn({ searchTerm }, "Artikel nicht gefunden");
    return null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMsg }, "Fehler beim Lesen des Lagerbestands");
    return null;
  }
}

/**
 * Aktualisiert Bestand in Excel (Spalte G für Innen, H für Außen)
 */
async function updateInventory(
  client: Client,
  config: ExcelConfig,
  searchTerm: string,
  quantityChange: number,
  lagerOrt: "innen" | "aussen",
  logger?: Logger
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  try {
    const worksheetName = config.inventoryWorksheetName || "Lagerliste";
    
    // Finde den Artikel zuerst
    const item = await readInventory(client, config, searchTerm, logger);
    
    if (!item) {
      return { 
        success: false, 
        error: `Artikel "${searchTerm}" nicht im Lagerbestand gefunden.` 
      };
    }

    // Berechne neuen Bestand
    const currentStock = lagerOrt === "innen" ? item.bestandInnen : item.bestandAussen;
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      return {
        success: false,
        error: `Nicht genug Bestand. Verfügbar: ${currentStock}, Benötigt: ${Math.abs(quantityChange)}`,
        newStock: currentStock,
      };
    }

    // Excel-Zeile ist 1-basiert, rowIndex ist 0-basiert
    const excelRow = item.rowIndex + 1;
    // Spalte G (Innen) = Index 6, Spalte H (Außen) = Index 7
    const columnLetter = lagerOrt === "innen" ? "G" : "H";
    const cellAddress = `${columnLetter}${excelRow}`;

    logger?.info({
      cellAddress,
      oldStock: currentStock,
      newStock,
      change: quantityChange,
      lagerOrt,
    }, "Aktualisiere Bestand");

    // Schreibe neuen Wert
    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='${cellAddress}')`)
      .patch({
        values: [[newStock]],
      });

    logger?.info({ searchTerm, newStock }, "Bestand erfolgreich aktualisiert");
    return { success: true, newStock };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMsg }, "Fehler beim Aktualisieren des Bestands");
    return { success: false, error: errorMsg };
  }
}

/**
 * Schreibt Transaktion in Excel
 */
async function writeTransaction(
  client: Client,
  config: ExcelConfig,
  output: ParserOutput,
  logger?: Logger
): Promise<boolean> {
  try {
    const worksheetName = config.transactionsWorksheetName || "Transaktionen";
    
    // Erstelle Transaktions-Zeile
    // Spalten: Timestamp, Aktion, Artikelname, Artikelnummer, Menge, Einheit, Lager, Projekt, Grund, Person, Telegram-User, Request-ID
    const transactionRow = [
      [
        formatTimestamp(output.timestamp_iso),
        output.action,
        output.item_name || "",
        output.sku || "",
        output.qty !== null ? output.qty : "",
        output.unit || "Stk",
        output.location || "",
        output.project_id || output.project_label || "",
        output.reason || "",
        output.person || "",
        output.telegram_username || String(output.telegram_user_id),
        output.request_id,
      ]
    ];

    // Füge Zeile am Ende hinzu
    // Zuerst: Hole die letzte benutzte Zeile
    let lastRow = 1;
    try {
      const usedRange = await client
        .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/usedRange`)
        .select("rowCount")
        .get();
      lastRow = usedRange.rowCount || 1;
    } catch {
      // Worksheet existiert vielleicht nicht oder ist leer
      logger?.warn("Transaktionen-Sheet leer oder nicht vorhanden, starte bei Zeile 1");
    }

    const nextRow = lastRow + 1;
    const range = `A${nextRow}:L${nextRow}`;

    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='${range}')`)
      .patch({
        values: transactionRow,
      });

    logger?.info({ row: nextRow, action: output.action }, "Transaktion geschrieben");
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMsg }, "Fehler beim Schreiben der Transaktion");
    return false;
  }
}

/**
 * Hauptfunktion: Schreibt Lagerbewegung in Excel
 */
export async function writeToExcel(
  output: ParserOutput,
  config: ExcelConfig,
  logger?: Logger
): Promise<ExcelWriteResult> {
  try {
    logger?.debug({ config: { ...config, clientSecret: "***" } }, "Excel adapter: Start");
    logger?.info(
      {
        action: output.action,
        item: output.item_name,
        sku: output.sku,
        qty: output.qty,
        authorized: output.authorized,
        duplicate: output.duplicate,
      },
      "Excel adapter: Verarbeite Output"
    );

    // Nur autorisierte und nicht-duplizierte Requests
    if (!output.authorized || output.duplicate) {
      logger?.debug(
        { authorized: output.authorized, duplicate: output.duplicate },
        "Excel adapter: Übersprungen"
      );
      return { success: true };
    }

    const client = createGraphClient(config);

    // Bestand aktualisieren
    let inventoryUpdateResult: { success: boolean; newStock?: number; error?: string } | undefined;
    let alertNeeded = false;
    let alertMessage = "";

    if (output.item_name || output.sku) {
      const searchTerm = output.item_name || output.sku || "";
      let quantityChange = 0;

      if (output.qty === null || output.qty === undefined) {
        logger?.warn({ action: output.action }, "Menge unklar - Bestand wird nicht aktualisiert");
      } else if (output.action === "withdraw") {
        quantityChange = -output.qty;
      } else if (output.action === "return") {
        quantityChange = output.qty;
      }

      if (quantityChange !== 0) {
        // Bestimme Lagerort aus location oder default zu "innen"
        const lagerOrt: "innen" | "aussen" = 
          output.location?.toLowerCase().includes("außen") || 
          output.location?.toLowerCase().includes("aussen") 
            ? "aussen" 
            : "innen";

        inventoryUpdateResult = await updateInventory(
          client,
          config,
          searchTerm,
          quantityChange,
          lagerOrt,
          logger
        );

        if (!inventoryUpdateResult.success) {
          return {
            success: false,
            error: inventoryUpdateResult.error,
          };
        }

        // Meldebestand prüfen (Schwelle: 10 Stück)
        const alertThreshold = 10;
        if (inventoryUpdateResult.newStock !== undefined && inventoryUpdateResult.newStock <= alertThreshold) {
          alertNeeded = true;
          alertMessage = `⚠️ Niedriger Bestand: ${output.item_name || output.sku} - ${inventoryUpdateResult.newStock} ${output.unit} (Meldebestand: ${alertThreshold})`;
          logger?.warn({ item: output.item_name, stock: inventoryUpdateResult.newStock }, "Meldebestand unterschritten");
        }
      }
    }

    // Transaktion protokollieren
    await writeTransaction(client, config, output, logger);

    logger?.info(
      {
        action: output.action,
        item: output.item_name,
        inventoryUpdated: inventoryUpdateResult?.success,
        newStock: inventoryUpdateResult?.newStock,
      },
      "Excel adapter: Erfolgreich"
    );

    return {
      success: true,
      inventoryUpdated: inventoryUpdateResult?.success,
      newStock: inventoryUpdateResult?.newStock,
      alertNeeded,
      alertMessage: alertNeeded ? alertMessage : undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMsg }, "Excel adapter: Fehler");
    return { success: false, error: errorMsg };
  }
}

/**
 * Erstellt Excel-Client mit Config aus ENV
 */
export async function createExcelClientFromEnv(logger?: Logger): Promise<{
  write: (output: ParserOutput) => Promise<ExcelWriteResult>;
} | null> {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const userPrincipalName = process.env.EXCEL_USER_PRINCIPAL_NAME;
  const filePath = process.env.EXCEL_FILE_PATH;

  if (!tenantId || !clientId || !clientSecret || !userPrincipalName || !filePath) {
    logger?.warn("Excel Config unvollständig - Adapter deaktiviert");
    logger?.debug({
      hasTenantId: !!tenantId,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasUserPrincipalName: !!userPrincipalName,
      hasFilePath: !!filePath,
    }, "Fehlende Excel ENV-Variablen");
    return null;
  }

  const config: ExcelConfig = {
    tenantId,
    clientId,
    clientSecret,
    userPrincipalName,
    filePath,
    inventoryWorksheetName: process.env.EXCEL_INVENTORY_WORKSHEET || "Lagerliste",
    transactionsWorksheetName: process.env.EXCEL_TRANSACTIONS_WORKSHEET || "Transaktionen",
  };

  return {
    write: (output: ParserOutput) => writeToExcel(output, config, logger),
  };
}
