/**
 * Script zum nachträglichen Hinzufügen von Bestandswarnungen
 */
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import "dotenv/config";

const config = {
  tenantId: process.env.MICROSOFT_TENANT_ID!,
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  userPrincipalName: process.env.EXCEL_USER_PRINCIPAL_NAME!,
  filePath: process.env.EXCEL_FILE_PATH!,
  alertsWorksheetName: process.env.EXCEL_ALERTS_WORKSHEET || "Bestandswarnungen",
};

// Bestandswarnungen die hinzugefügt werden sollen
const stockAlerts = [
  {
    timestamp: "29.01.2026, 15:45:00",
    artikel: "WKD-019ML",
    skuIntern: "",
    skuExtern: "WKD-019ML",
    aktuellerBestand: 4,
    meldebestand: 10,
    differenz: -6,
    status: "⚠️ Offen",
    lagerort: "Außenlager",
  },
  {
    timestamp: "29.01.2026, 15:48:00",
    artikel: "FDB221AA",
    skuIntern: "",
    skuExtern: "FDB221AA",
    aktuellerBestand: 10,
    meldebestand: 10,
    differenz: 0,
    status: "⚠️ Offen",
    lagerort: "Innenlager",
  },
];

function createGraphClient(): Client {
  const credential = new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  return Client.initWithMiddleware({ authProvider });
}

async function addStockAlerts() {
  console.log("🔧 Füge Bestandswarnungen hinzu...\n");

  const client = createGraphClient();
  const worksheetName = config.alertsWorksheetName;

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

  // Prüfe ob Worksheet existiert
  let existingRows: unknown[][] = [];
  let hasData = false;

  try {
    const usedRange = await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/usedRange`)
      .get();
    existingRows = usedRange.values || [];
    hasData = existingRows.length > 0;
    console.log(`📋 Worksheet "${worksheetName}" gefunden mit ${existingRows.length} Zeilen`);
  } catch (error: any) {
    if (error.statusCode === 404 || error.message?.includes("ItemNotFound")) {
      console.log(`📝 Worksheet "${worksheetName}" existiert nicht, wird erstellt...`);
      
      // Erstelle neues Worksheet
      try {
        await client
          .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets`)
          .post({ name: worksheetName });
        console.log(`✅ Worksheet "${worksheetName}" erstellt`);
      } catch (createError: any) {
        console.error("❌ Fehler beim Erstellen des Worksheets:", createError.message);
        return;
      }
    } else {
      console.error("❌ Fehler:", error.message);
      return;
    }
  }

  // Erstelle Header falls nicht vorhanden
  if (!hasData) {
    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='A1:I1')`)
      .patch({
        values: [headerRow],
      });
    console.log("📋 Header erstellt");
    existingRows = [headerRow];
  }

  // Füge KW-Trenner ein
  const now = new Date();
  const weekNum = getWeekNumber(now);
  const kwRow = [`--- KW ${weekNum.week}/${weekNum.year} ---`, "", "", "", "", "", "", "", ""];
  
  let nextRow = existingRows.length + 1;
  
  // Prüfe ob KW-Trenner bereits existiert
  const kwExists = existingRows.some(row => 
    row && String(row[0] || "").includes(`KW ${weekNum.week}/${weekNum.year}`)
  );
  
  if (!kwExists) {
    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='A${nextRow}:I${nextRow}')`)
      .patch({
        values: [kwRow],
      });
    console.log(`📅 KW-Trenner eingefügt: KW ${weekNum.week}/${weekNum.year}`);
    nextRow++;
  }

  // Füge Bestandswarnungen hinzu
  for (const alert of stockAlerts) {
    const row = [
      alert.timestamp,
      alert.artikel,
      alert.skuIntern,
      alert.skuExtern,
      alert.aktuellerBestand,
      alert.meldebestand,
      alert.differenz,
      alert.status,
      alert.lagerort,
    ];

    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='A${nextRow}:I${nextRow}')`)
      .patch({
        values: [row],
      });
    
    console.log(`✅ Hinzugefügt: ${alert.artikel} - ${alert.aktuellerBestand} Stk (Zeile ${nextRow})`);
    nextRow++;
  }

  console.log("\n🎉 Fertig! Bestandswarnungen wurden hinzugefügt.");
}

function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

addStockAlerts().catch(console.error);
