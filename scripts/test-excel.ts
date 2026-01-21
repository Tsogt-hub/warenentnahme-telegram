/**
 * Test-Skript für Excel-Adapter
 * Testet die Verbindung zu OneDrive/SharePoint Excel
 */
import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";

async function testExcelConnection() {
  console.log("🔍 Teste Excel/OneDrive Verbindung...\n");

  // ENV-Variablen prüfen
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const userPrincipalName = process.env.EXCEL_USER_PRINCIPAL_NAME;
  const filePath = process.env.EXCEL_FILE_PATH;

  console.log("📋 ENV-Variablen:");
  console.log(`   MICROSOFT_TENANT_ID: ${tenantId ? "✅ Gesetzt" : "❌ Fehlt"}`);
  console.log(`   MICROSOFT_CLIENT_ID: ${clientId ? "✅ Gesetzt" : "❌ Fehlt"}`);
  console.log(`   MICROSOFT_CLIENT_SECRET: ${clientSecret ? "✅ Gesetzt" : "❌ Fehlt"}`);
  console.log(`   EXCEL_USER_PRINCIPAL_NAME: ${userPrincipalName || "❌ Fehlt"}`);
  console.log(`   EXCEL_FILE_PATH: ${filePath || "❌ Fehlt"}`);
  console.log();

  if (!tenantId || !clientId || !clientSecret || !userPrincipalName || !filePath) {
    console.log("❌ Fehlende ENV-Variablen. Bitte .env Datei prüfen.");
    process.exit(1);
  }

  try {
    // Graph Client erstellen
    console.log("🔐 Authentifiziere bei Microsoft Graph API...");
    
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ["https://graph.microsoft.com/.default"],
    });
    const client = Client.initWithMiddleware({ authProvider });

    console.log("✅ Authentifizierung erfolgreich!\n");

    // Benutzer-Drive prüfen
    console.log(`📂 Prüfe OneDrive von ${userPrincipalName}...`);
    
    const drive = await client
      .api(`/users/${userPrincipalName}/drive`)
      .select("id,name,driveType")
      .get();

    console.log(`✅ Drive gefunden: ${drive.name} (${drive.driveType})\n`);

    // Excel-Datei prüfen
    console.log(`📄 Suche Excel-Datei: ${filePath}...`);
    
    const file = await client
      .api(`/users/${userPrincipalName}/drive/root:${filePath}`)
      .select("id,name,size,lastModifiedDateTime")
      .get();

    console.log(`✅ Datei gefunden!`);
    console.log(`   Name: ${file.name}`);
    console.log(`   Größe: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Zuletzt geändert: ${file.lastModifiedDateTime}\n`);

    // Worksheets auflisten
    console.log("📊 Lese Worksheets...");
    
    const worksheets = await client
      .api(`/users/${userPrincipalName}/drive/root:${filePath}:/workbook/worksheets`)
      .get();

    console.log(`✅ ${worksheets.value.length} Worksheet(s) gefunden:`);
    for (const ws of worksheets.value) {
      console.log(`   - ${ws.name} (ID: ${ws.id})`);
    }
    console.log();

    // Lagerbestand-Sheet lesen
    const inventorySheet = worksheets.value.find((ws: any) => 
      ws.name.toLowerCase().includes("lager") || ws.name.toLowerCase().includes("bestand")
    ) || worksheets.value[0];

    console.log(`📋 Lese Daten aus "${inventorySheet.name}"...`);
    
    const usedRange = await client
      .api(`/users/${userPrincipalName}/drive/root:${filePath}:/workbook/worksheets('${inventorySheet.name}')/usedRange`)
      .select("address,rowCount,columnCount")
      .get();

    console.log(`✅ Datenbereich: ${usedRange.address}`);
    console.log(`   Zeilen: ${usedRange.rowCount}`);
    console.log(`   Spalten: ${usedRange.columnCount}\n`);

    // Erste paar Zeilen lesen
    console.log("📝 Erste Zeilen (Vorschau):");
    
    const preview = await client
      .api(`/users/${userPrincipalName}/drive/root:${filePath}:/workbook/worksheets('${inventorySheet.name}')/range(address='A1:I25')`)
      .get();

    const rows = preview.values || [];
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (row.some((cell: any) => cell)) {
        console.log(`   ${i + 1}: ${row.slice(0, 5).map((c: any) => c || "").join(" | ")}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ EXCEL-VERBINDUNG ERFOLGREICH!");
    console.log("=".repeat(60));
    console.log("\nDer Excel-Adapter ist bereit für den Einsatz.");
    console.log("Setze OUTBOUND_MODE=excel in den ENV-Variablen.\n");

  } catch (error) {
    console.error("\n❌ FEHLER:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("unauthorized") || error.message.includes("401")) {
        console.log("\n💡 Mögliche Ursachen:");
        console.log("   - Client Secret ist falsch oder abgelaufen");
        console.log("   - App hat keine Admin-Zustimmung");
        console.log("   - Tenant ID oder Client ID sind falsch");
      } else if (error.message.includes("not found") || error.message.includes("404")) {
        console.log("\n💡 Mögliche Ursachen:");
        console.log("   - Excel-Datei nicht gefunden");
        console.log("   - Pfad ist falsch (muss mit / beginnen)");
        console.log("   - User Principal Name ist falsch");
      } else if (error.message.includes("forbidden") || error.message.includes("403")) {
        console.log("\n💡 Mögliche Ursachen:");
        console.log("   - App hat keine Files.ReadWrite.All Berechtigung");
        console.log("   - Admin-Zustimmung fehlt");
      }
    }
    
    process.exit(1);
  }
}

testExcelConnection();
