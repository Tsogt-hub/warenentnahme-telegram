import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import OpenAI from "openai";
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
  alertsWorksheetName?: string; // Default: "Bestandswarnungen"
  // OpenAI für intelligente Artikelsuche
  openaiApiKey?: string;
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

// Cache für Inventory-Daten (vermeidet wiederholte API-Calls)
interface InventoryCache {
  rows: unknown[][];
  headers: unknown[];
  headerRowIndex: number;
  colBezeichnung: number;
  colInterneNr: number;
  colExterneNr: number;
  timestamp: number;
}

let inventoryCache: InventoryCache | null = null;
const CACHE_TTL_MS = 60000; // 60 Sekunden Cache-Gültigkeit

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
 * Normalisiert Suchbegriffe für besseres Matching
 * - Entfernt Plural-Endungen
 * - Normalisiert Einheiten (mm² → qmm, mm2 → qmm)
 * - Entfernt Sonderzeichen
 */
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    // Einheiten normalisieren
    .replace(/mm²/g, "qmm")
    .replace(/mm2/g, "qmm")
    .replace(/m²/g, "qm")
    .replace(/m2/g, "qm")
    // Plural-Endungen entfernen
    .replace(/klemmen\b/g, "klemme")
    .replace(/schrauben\b/g, "schraube")
    .replace(/muttern\b/g, "mutter")
    .replace(/rollen\b/g, "rolle")
    .replace(/stücke?\b/g, "stk")
    // Sonderzeichen entfernen für Matching
    .replace(/[^\w\däöüß]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrahiert relevante Wörter aus einem Text
 */
function extractKeywords(text: string): string[] {
  const normalized = normalizeSearchTerm(text);
  return normalized.split(" ").filter(w => w.length >= 2);
}

/**
 * Berechnet wie gut zwei Texte übereinstimmen (0-1)
 * Prüft Wort-basiertes Matching
 */
function calculateMatchScore(searchTerm: string, text: string): number {
  const searchKeywords = extractKeywords(searchTerm);
  const textNormalized = normalizeSearchTerm(text);
  
  if (searchKeywords.length === 0) return 0;
  
  let matchedWords = 0;
  for (const keyword of searchKeywords) {
    // Exakter Wort-Match oder Wort beginnt damit
    if (textNormalized.includes(keyword)) {
      matchedWords++;
    } else {
      // Prüfe ob Wortanfang passt (min 4 Zeichen)
      if (keyword.length >= 4) {
        const prefix = keyword.slice(0, 4);
        if (textNormalized.includes(prefix)) {
          matchedWords += 0.5;
        }
      }
    }
  }
  
  return matchedWords / searchKeywords.length;
}

/**
 * Nutzt OpenAI um den besten Artikel-Match zu finden
 */
async function findBestMatchWithAI(
  searchTerm: string,
  artikelListe: { bezeichnung: string; interneNr?: string; externeNr?: string; rowIndex: number }[],
  openaiApiKey: string,
  logger?: Logger
): Promise<number | null> {
  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Erstelle kompakte Artikelliste für OpenAI (mit Artikelnummern)
    const artikelText = artikelListe
      .map((a, i) => {
        let entry = `${i}: ${a.bezeichnung}`;
        if (a.interneNr) entry += ` [Intern: ${a.interneNr}]`;
        if (a.externeNr) entry += ` [Extern: ${a.externeNr}]`;
        return entry;
      })
      .join("\n");
    
    const prompt = `Du bist ein Lager-Assistent. Der Benutzer sucht nach: "${searchTerm}"

Hier ist die Artikelliste (Index: Bezeichnung [Artikelnummern]):
${artikelText}

Antworte NUR mit der Index-Nummer des am besten passenden Artikels.
Beachte:
- Suche AUCH nach Artikelnummern (Intern/Extern)! "WKD 019ML" = Externe Artikelnummer
- "Schutzleiterklemmen" = "Schutzleiterklemme" (Singular/Plural)
- "10mm" = "10qmm" = "10mm²" (gleiche Größe)
- Ignoriere Zusätze wie "2 Leiter"

Wenn kein passender Artikel existiert, antworte mit: -1

Antwort (nur Zahl):`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0,
    });

    const answer = response.choices[0]?.message?.content?.trim() || "-1";
    const matchIndex = parseInt(answer, 10);
    
    logger?.info({ searchTerm, matchIndex, answer }, "OpenAI Artikel-Match");
    
    if (isNaN(matchIndex) || matchIndex < 0 || matchIndex >= artikelListe.length) {
      return null;
    }
    
    return artikelListe[matchIndex].rowIndex;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMsg }, "OpenAI Artikel-Match fehlgeschlagen");
    return null;
  }
}

/**
 * Lädt oder gibt gecachte Inventory-Daten zurück
 */
async function getInventoryData(
  client: Client,
  config: ExcelConfig,
  logger?: Logger,
  forceRefresh = false
): Promise<InventoryCache | null> {
  const now = Date.now();
  
  // Nutze Cache wenn gültig
  if (!forceRefresh && inventoryCache && (now - inventoryCache.timestamp) < CACHE_TTL_MS) {
    logger?.debug("Nutze Inventory-Cache");
    return inventoryCache;
  }

  const worksheetName = config.inventoryWorksheetName || "Lagerliste";
  logger?.debug("Lade Inventory-Daten von Excel...");
  
  const response = await client
    .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/usedRange`)
    .get();

  const rows = response.values || [];
  if (rows.length < 2) {
    logger?.warn("Keine Daten im Lagerbestand-Sheet gefunden");
    return null;
  }

  // Header finden
  let headerRowIndex = 0;
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
  
  const findColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex((h: string) => 
        h && typeof h === 'string' && h.toLowerCase().includes(name.toLowerCase())
      );
      if (index >= 0) return index;
    }
    return -1;
  };

  // Cache aktualisieren
  inventoryCache = {
    rows,
    headers,
    headerRowIndex,
    colBezeichnung: findColumnIndex(["Bezeichnung", "Artikelbezeichnung", "Name"]),
    colInterneNr: findColumnIndex(["Interne", "Interne Artikel", "Artikel-Nr", "Artikelnummer", "Art-Nr"]),
    colExterneNr: findColumnIndex(["Externe", "Externe Artikel", "Lieferanten", "Hersteller-Nr", "Hersteller Artikel", "Fremd"]),
    timestamp: now,
  };

  logger?.debug({ cacheSize: rows.length }, "Inventory-Cache aktualisiert");
  return inventoryCache;
}

/**
 * Liest Lagerbestand aus Excel (mit Caching)
 */
async function readInventory(
  client: Client,
  config: ExcelConfig,
  searchTerm: string,
  logger?: Logger
): Promise<InventoryItem | null> {
  try {
    // Nutze Cache
    const cache = await getInventoryData(client, config, logger);
    if (!cache) return null;

    const { rows, colBezeichnung, colInterneNr, colExterneNr } = cache;
    const dataStartRowIndex = 2; // Zeile 3 (0-basiert)
    // Feste Spalten: G=Bestand Innen (Index 6), H=Bestand Außen (Index 7), I=Gesamtbestand (Index 8)
    const colBestandInnen = 6; // Spalte G
    const colBestandAussen = 7; // Spalte H
    const colGesamtbestand = 8; // Spalte I

    logger?.debug({
      colBezeichnung,
      colInterneNr,
      colExterneNr,
      colBestandInnen,
      colBestandAussen,
      searchTerm,
    }, "Spalten-Mapping und Suchbegriff");

    // Suche nach Artikel mit Fuzzy-Matching
    const searchLower = searchTerm.toLowerCase().trim();
    // Auch ohne Leerzeichen/Bindestriche vergleichen für besseres Matching
    const searchNormalized = searchLower.replace(/[\s\-_\.]/g, "");
    
    let bestMatch: InventoryItem | null = null;
    let bestScore = 0;
    const MATCH_THRESHOLD = 0.75; // Mindestens 75% Match für Fuzzy, sonst OpenAI-Fallback
    
    for (let i = dataStartRowIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const bezeichnung = colBezeichnung >= 0 ? String(row[colBezeichnung] || "").trim() : "";
      const interneNr = colInterneNr >= 0 ? String(row[colInterneNr] || "").trim() : "";
      const externeNr = colExterneNr >= 0 ? String(row[colExterneNr] || "").trim() : "";
      
      // Normalisierte Versionen für Matching
      const interneNrNorm = interneNr.toLowerCase().replace(/[\s\-_\.]/g, "");
      const externeNrNorm = externeNr.toLowerCase().replace(/[\s\-_\.]/g, "");

      // 1. Exakter Match auf Artikelnummer (inkl. normalisiert)
      if (
        interneNr.toLowerCase() === searchLower ||
        externeNr.toLowerCase() === searchLower ||
        interneNrNorm === searchNormalized ||
        externeNrNorm === searchNormalized
      ) {
        logger?.info({ found: bezeichnung, interneNr, externeNr, row: i + 1, matchType: "exact_sku" }, "Artikel gefunden (exakte Artikelnummer)");
        return {
          rowIndex: i,
          lagerplatzInnen: String(row[0] || "") || undefined,
          lagerplatzAussen: String(row[1] || "") || undefined,
          interneArtikelnummer: interneNr || undefined,
          externeArtikelnummer: externeNr || undefined,
          bezeichnung: bezeichnung || undefined,
          hersteller: String(row[5] || "") || undefined,
          bestandInnen: Number(row[colBestandInnen] || 0),
          bestandAussen: Number(row[colBestandAussen] || 0),
          gesamtbestand: Number(row[colGesamtbestand] || 0),
        };
      }
      
      // 2. Teilstring-Match auf Artikelnummer (z.B. "WKD019ML" enthält "WKD 019ML")
      if (
        (interneNrNorm && (interneNrNorm.includes(searchNormalized) || searchNormalized.includes(interneNrNorm))) ||
        (externeNrNorm && (externeNrNorm.includes(searchNormalized) || searchNormalized.includes(externeNrNorm)))
      ) {
        logger?.info({ found: bezeichnung, interneNr, externeNr, row: i + 1, matchType: "partial_sku" }, "Artikel gefunden (Teilstring Artikelnummer)");
        return {
          rowIndex: i,
          lagerplatzInnen: String(row[0] || "") || undefined,
          lagerplatzAussen: String(row[1] || "") || undefined,
          interneArtikelnummer: interneNr || undefined,
          externeArtikelnummer: externeNr || undefined,
          bezeichnung: bezeichnung || undefined,
          hersteller: String(row[5] || "") || undefined,
          bestandInnen: Number(row[colBestandInnen] || 0),
          bestandAussen: Number(row[colBestandAussen] || 0),
          gesamtbestand: Number(row[colGesamtbestand] || 0),
        };
      }

      // 3. Exakter Match auf Bezeichnung
      if (bezeichnung.toLowerCase() === searchLower) {
        logger?.info({ found: bezeichnung, row: i + 1, matchType: "exact_name" }, "Artikel gefunden (exakte Bezeichnung)");
        return {
          rowIndex: i,
          lagerplatzInnen: String(row[0] || "") || undefined,
          lagerplatzAussen: String(row[1] || "") || undefined,
          interneArtikelnummer: interneNr || undefined,
          externeArtikelnummer: externeNr || undefined,
          bezeichnung: bezeichnung || undefined,
          hersteller: String(row[5] || "") || undefined,
          bestandInnen: Number(row[colBestandInnen] || 0),
          bestandAussen: Number(row[colBestandAussen] || 0),
          gesamtbestand: Number(row[colGesamtbestand] || 0),
        };
      }

      // 4. Fuzzy-Match auf Bezeichnung
      const score = calculateMatchScore(searchTerm, bezeichnung);
      logger?.debug({ bezeichnung, score, searchTerm }, "Match-Score");
      
      if (score > bestScore && score >= MATCH_THRESHOLD) {
        bestScore = score;
        bestMatch = {
          rowIndex: i,
          lagerplatzInnen: String(row[0] || "") || undefined,
          lagerplatzAussen: String(row[1] || "") || undefined,
          interneArtikelnummer: interneNr || undefined,
          externeArtikelnummer: externeNr || undefined,
          bezeichnung: bezeichnung || undefined,
          hersteller: String(row[5] || "") || undefined,
          bestandInnen: Number(row[colBestandInnen] || 0),
          bestandAussen: Number(row[colBestandAussen] || 0),
          gesamtbestand: Number(row[colGesamtbestand] || 0),
        };
      }
    }

    if (bestMatch) {
      logger?.info({ 
        found: bestMatch.bezeichnung, 
        row: bestMatch.rowIndex + 1, 
        matchType: "fuzzy", 
        score: bestScore 
      }, "Artikel gefunden (Fuzzy-Match)");
      return bestMatch;
    }

    // 5. OpenAI-Fallback: Intelligente Artikelsuche
    if (config.openaiApiKey) {
      logger?.info({ searchTerm }, "Fuzzy-Match fehlgeschlagen, versuche OpenAI...");
      
      // Sammle alle Artikel für OpenAI (inkl. Artikelnummern)
      const artikelListe: { bezeichnung: string; interneNr?: string; externeNr?: string; rowIndex: number }[] = [];
      for (let i = dataStartRowIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const bezeichnung = colBezeichnung >= 0 ? String(row[colBezeichnung] || "").trim() : "";
        const interneNr = colInterneNr >= 0 ? String(row[colInterneNr] || "").trim() : "";
        const externeNr = colExterneNr >= 0 ? String(row[colExterneNr] || "").trim() : "";
        if (bezeichnung || interneNr || externeNr) {
          artikelListe.push({ 
            bezeichnung, 
            interneNr: interneNr || undefined, 
            externeNr: externeNr || undefined, 
            rowIndex: i 
          });
        }
      }
      
      const aiMatchRowIndex = await findBestMatchWithAI(
        searchTerm, 
        artikelListe, 
        config.openaiApiKey, 
        logger
      );
      
      if (aiMatchRowIndex !== null) {
        const row = rows[aiMatchRowIndex];
        const bezeichnung = colBezeichnung >= 0 ? String(row[colBezeichnung] || "").trim() : "";
        const interneNr = colInterneNr >= 0 ? String(row[colInterneNr] || "").trim() : "";
        const externeNr = colExterneNr >= 0 ? String(row[colExterneNr] || "").trim() : "";
        
        logger?.info({ 
          found: bezeichnung, 
          row: aiMatchRowIndex + 1, 
          matchType: "openai" 
        }, "Artikel gefunden (OpenAI-Match)");
        
        return {
          rowIndex: aiMatchRowIndex,
          lagerplatzInnen: String(row[0] || "") || undefined,
          lagerplatzAussen: String(row[1] || "") || undefined,
          interneArtikelnummer: interneNr || undefined,
          externeArtikelnummer: externeNr || undefined,
          bezeichnung: bezeichnung || undefined,
          hersteller: String(row[5] || "") || undefined,
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
 * Schreibt Bestandswarnung in Excel (separater Tab)
 * - Prüft ob Artikel bereits in der Liste ist (verhindert Duplikate)
 * - Erstellt Header falls Tab neu ist
 */
async function writeStockAlert(
  client: Client,
  config: ExcelConfig,
  articleInfo: {
    bezeichnung?: string;
    sku?: string;
    externeNr?: string;
    currentStock: number;
    alertThreshold: number;
    location?: string;
  },
  logger?: Logger
): Promise<boolean> {
  try {
    const worksheetName = config.alertsWorksheetName || "Bestandswarnungen";
    
    logger?.info({ worksheetName, article: articleInfo.bezeichnung || articleInfo.sku }, "Schreibe Bestandswarnung");

    // Prüfe ob Worksheet existiert, erstelle Header falls nötig
    let existingRows: unknown[][] = [];
    let hasHeader = false;
    
    try {
      const usedRange = await client
        .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/usedRange`)
        .get();
      existingRows = usedRange.values || [];
      hasHeader = existingRows.length > 0;
    } catch {
      // Worksheet existiert nicht oder ist leer
      logger?.info("Bestandswarnungen-Sheet leer oder nicht vorhanden, erstelle Header");
    }

    // Header-Zeile
    const headerRow = [
      "Zeitstempel",
      "Artikel",
      "SKU (Intern)",
      "SKU (Extern)",
      "Aktueller Bestand",
      "Meldebestand",
      "Differenz",
      "Status",
      "Lagerort",
    ];

    // Erstelle Header falls nicht vorhanden
    if (!hasHeader) {
      await client
        .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='A1:I1')`)
        .patch({
          values: [headerRow],
        });
      logger?.info("Bestandswarnungen: Header erstellt");
      existingRows = [headerRow];
    }

    // Prüfe ob Artikel bereits in der Liste ist (Status "Offen" oder "⚠️ Offen")
    const searchTerm = (articleInfo.bezeichnung || articleInfo.sku || "").toLowerCase();
    const skuSearch = (articleInfo.sku || "").toLowerCase();
    const externeSearch = (articleInfo.externeNr || "").toLowerCase();
    
    for (let i = 1; i < existingRows.length; i++) {
      const row = existingRows[i];
      if (!row) continue;
      
      const rowArtikel = String(row[1] || "").toLowerCase();
      const rowSkuIntern = String(row[2] || "").toLowerCase();
      const rowSkuExtern = String(row[3] || "").toLowerCase();
      const rowStatus = String(row[7] || "").toLowerCase();
      
      // Prüfe ob bereits vorhanden UND noch offen
      const isMatch = 
        (searchTerm && rowArtikel.includes(searchTerm)) ||
        (skuSearch && rowSkuIntern === skuSearch) ||
        (externeSearch && rowSkuExtern === externeSearch);
      
      const isOpen = rowStatus.includes("offen") || rowStatus === "";
      
      if (isMatch && isOpen) {
        logger?.info({ article: articleInfo.bezeichnung, row: i + 1 }, "Artikel bereits in Bestandswarnungen (offen)");
        
        // Aktualisiere den aktuellen Bestand in der bestehenden Zeile
        const differenz = articleInfo.currentStock - articleInfo.alertThreshold;
        await client
          .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='E${i + 1}:G${i + 1}')`)
          .patch({
            values: [[articleInfo.currentStock, articleInfo.alertThreshold, differenz]],
          });
        
        return true; // Bereits vorhanden, nur aktualisiert
      }
    }

    // Neue Warnung eintragen
    const differenz = articleInfo.currentStock - articleInfo.alertThreshold;
    const newRow = [
      formatTimestamp(new Date().toISOString()),
      articleInfo.bezeichnung || "",
      articleInfo.sku || "",
      articleInfo.externeNr || "",
      articleInfo.currentStock,
      articleInfo.alertThreshold,
      differenz,
      "⚠️ Offen",
      articleInfo.location || "",
    ];

    const nextRow = existingRows.length + 1;
    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='A${nextRow}:I${nextRow}')`)
      .patch({
        values: [newRow],
      });

    logger?.info({ article: articleInfo.bezeichnung, row: nextRow }, "Bestandswarnung hinzugefügt");
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger?.error({ error: errorMsg }, "Fehler beim Schreiben der Bestandswarnung");
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

    // Nur autorisierte und nicht-duplizierte Requests, keine "reject" Aktionen
    if (!output.authorized || output.duplicate || output.action === "reject") {
      logger?.debug(
        { authorized: output.authorized, duplicate: output.duplicate, action: output.action },
        "Excel adapter: Übersprungen (nicht autorisiert, Duplikat oder reject)"
      );
      return { success: true };
    }

    const client = createGraphClient(config);

    // Bestand aktualisieren
    let inventoryUpdateResult: { success: boolean; newStock?: number; error?: string } | undefined;
    let alertNeeded = false;
    let alertMessage = "";

    if (output.item_name || output.sku) {
      // Priorisiere SKU für Artikelnummer-Suche (intern oder extern)
      // Wenn SKU vorhanden und nach Artikelnummer-Muster aussieht, nutze SKU als primären Suchterm
      let searchTerm = output.item_name || output.sku || "";
      
      // Wenn SKU vorhanden ist und wie eine Artikelnummer aussieht, nutze sie primär
      if (output.sku) {
        const skuLooksLikeArticleNumber = /^[A-Z0-9\-_]+$/i.test(output.sku.trim());
        if (skuLooksLikeArticleNumber) {
          searchTerm = output.sku; // Nutze SKU als primären Suchbegriff
          logger?.info({ sku: output.sku }, "Nutze SKU als primären Suchbegriff (vermutlich Artikelnummer)");
        }
      }
      
      // Wenn notes Größenangaben enthält, füge sie zum Suchterm hinzu
      if (output.notes) {
        const sizeMatch = output.notes.match(/(\d+\s*(?:mm|qmm|mm²|cm|m)\b)/i);
        if (sizeMatch) {
          searchTerm = `${searchTerm} ${sizeMatch[1]}`.trim();
        }
      }
      
      // Falls der confirmation_text mehr Details hat, extrahiere Größenangaben
      if (output.confirmation_text) {
        const sizeMatch = output.confirmation_text.match(/(\d+\s*(?:mm|qmm|mm²|cm|m)\b)/i);
        if (sizeMatch && !searchTerm.toLowerCase().includes(sizeMatch[1].toLowerCase())) {
          searchTerm = `${searchTerm} ${sizeMatch[1]}`.trim();
        }
      }
      
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
          
          // Bestandswarnung in separaten Tab schreiben
          try {
            // Hole Artikel-Details für die Warnung
            const articleDetails = await readInventory(client, config, searchTerm, logger);
            
            await writeStockAlert(client, config, {
              bezeichnung: articleDetails?.bezeichnung || output.item_name || undefined,
              sku: articleDetails?.interneArtikelnummer || output.sku || undefined,
              externeNr: articleDetails?.externeArtikelnummer || undefined,
              currentStock: inventoryUpdateResult.newStock,
              alertThreshold,
              location: output.location || (lagerOrt === "aussen" ? "Außenlager" : "Innenlager"),
            }, logger);
          } catch (alertError) {
            logger?.error({ error: alertError }, "Fehler beim Schreiben der Bestandswarnung");
            // Nicht abbrechen - Haupttransaktion war erfolgreich
          }
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
    alertsWorksheetName: process.env.EXCEL_ALERTS_WORKSHEET || "Bestandswarnungen",
    openaiApiKey: process.env.OPENAI_API_KEY, // Für intelligente Artikelsuche
  };
  
  if (config.openaiApiKey) {
    logger?.info("OpenAI-basierte Artikelsuche aktiviert");
  }

  return {
    write: (output: ParserOutput) => writeToExcel(output, config, logger),
  };
}
