/**
 * Script zum Hinzufügen eines Dropdown-Menüs für die Status-Spalte
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

async function addDropdownValidation() {
  console.log("🔧 Füge Dropdown-Validierung für Status-Spalte hinzu...\n");

  const client = createGraphClient();
  const worksheetName = config.alertsWorksheetName;

  try {
    // Die Status-Optionen
    const statusOptions = [
      "⚠️ Offen",
      "📦 Bestellt",
      "✅ Erledigt",
    ];

    // Erstelle Datenvalidierung für Spalte H (Status) - Zeilen 2-100
    // Microsoft Graph API unterstützt leider keine direkte Datenvalidierung
    // Stattdessen erstellen wir eine Hilfsspalte mit den Optionen
    
    // Schreibe Status-Optionen in eine versteckte Hilfsspalte (K)
    console.log("📝 Erstelle Status-Optionen in Spalte K...");
    
    await client
      .api(`/users/${config.userPrincipalName}/drive/root:${config.filePath}:/workbook/worksheets('${worksheetName}')/range(address='K1:K4')`)
      .patch({
        values: [
          ["Status-Optionen"],
          ["⚠️ Offen"],
          ["📦 Bestellt"],
          ["✅ Erledigt"],
        ],
      });

    console.log("✅ Status-Optionen erstellt in Spalte K");
    console.log("\n📋 Verfügbare Status-Werte:");
    statusOptions.forEach(s => console.log(`   - ${s}`));
    
    console.log("\n💡 Hinweis: Um ein echtes Dropdown zu erstellen:");
    console.log("   1. Öffne die Excel-Datei");
    console.log("   2. Wähle die Zellen in Spalte H (Status) ab Zeile 2");
    console.log("   3. Gehe zu: Daten → Datenüberprüfung");
    console.log("   4. Wähle 'Liste' und gib als Quelle ein: =$K$2:$K$4");
    console.log("   5. Klicke OK");
    console.log("\n   Alternativ: Spalte K kann ausgeblendet werden (Rechtsklick → Ausblenden)");

  } catch (error: any) {
    console.error("❌ Fehler:", error.message);
  }
}

addDropdownValidation().catch(console.error);
