import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";

async function addHeaders() {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const userPrincipalName = process.env.EXCEL_USER_PRINCIPAL_NAME;
  const filePath = process.env.EXCEL_FILE_PATH;

  if (!tenantId || !clientId || !clientSecret || !userPrincipalName || !filePath) {
    console.error("❌ Fehlende ENV-Variablen");
    process.exit(1);
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  
  const client = Client.initWithMiddleware({ authProvider });
  
  console.log("📝 Füge Header-Zeile zu Transaktionen hinzu...");
  
  const headers = [[
    "Timestamp",
    "Aktion", 
    "Artikelname",
    "Artikelnummer",
    "Menge",
    "Einheit",
    "Lager",
    "Projekt",
    "Grund",
    "Person",
    "Telegram-User",
    "Request-ID"
  ]];
  
  const apiPath = `/users/${userPrincipalName}/drive/root:${filePath}:/workbook/worksheets('Transaktionen')/range(address='A1:L1')`;
  
  console.log("API Path:", apiPath);
  
  await client
    .api(apiPath)
    .patch({ values: headers });
  
  console.log("✅ Header-Zeile hinzugefügt!");
  console.log("✅ Transaktionen-Sheet ist bereit!");
}

addHeaders().catch(console.error);
