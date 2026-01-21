/**
 * Script zum Korrigieren des Lagerbestands
 * Setzt Zeile 5 (16qmm) zurück auf 20
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import "dotenv/config";

async function main() {
  const tenantId = process.env.MICROSOFT_TENANT_ID!;
  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const userPrincipalName = process.env.EXCEL_USER_PRINCIPAL_NAME!;
  const filePath = process.env.EXCEL_FILE_PATH!;
  const worksheetName = "Lagerliste";

  console.log("🔧 Korrigiere Lagerbestand...");
  console.log(`   Datei: ${filePath}`);
  console.log(`   Worksheet: ${worksheetName}`);

  // Graph Client erstellen
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  const client = Client.initWithMiddleware({ authProvider });

  // Zeile 5, Spalte G (Bestand Innen) auf 20 setzen
  const cellAddress = "G5";
  const newValue = 20;

  console.log(`\n📝 Setze ${cellAddress} auf ${newValue}...`);

  await client
    .api(`/users/${userPrincipalName}/drive/root:${filePath}:/workbook/worksheets('${worksheetName}')/range(address='${cellAddress}')`)
    .patch({
      values: [[newValue]],
    });

  console.log(`✅ Bestand korrigiert: Zeile 5 (16qmm) = ${newValue}`);
}

main().catch((err) => {
  console.error("❌ Fehler:", err.message);
  process.exit(1);
});
