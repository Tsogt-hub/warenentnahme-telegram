# Excel-Adapter ENV-Variablen

## Für Railway / .env Datei

Füge diese Variablen zu deiner `.env` Datei oder Railway Environment hinzu:

```env
# === EXCEL / MICROSOFT GRAPH API ===
OUTBOUND_MODE=excel

# Azure App Registration
MICROSOFT_TENANT_ID=<your-tenant-id>
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>

# OneDrive / Excel Datei
EXCEL_USER_PRINCIPAL_NAME=user@yourdomain.onmicrosoft.com
EXCEL_FILE_PATH=/YourExcelFile.xlsx

# Optional: Worksheet-Namen (Standard: Lagerliste, Transaktionen)
EXCEL_INVENTORY_WORKSHEET=Lagerliste
EXCEL_TRANSACTIONS_WORKSHEET=Transaktionen
```

## Variablen-Beschreibung

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `OUTBOUND_MODE` | Muss auf `excel` gesetzt sein | `excel` |
| `MICROSOFT_TENANT_ID` | Azure Directory (Tenant) ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MICROSOFT_CLIENT_ID` | Azure Application (Client) ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MICROSOFT_CLIENT_SECRET` | Azure Client Secret Value | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `EXCEL_USER_PRINCIPAL_NAME` | E-Mail des OneDrive-Besitzers | `user@domain.onmicrosoft.com` |
| `EXCEL_FILE_PATH` | Pfad zur Excel-Datei (mit `/` am Anfang) | `/Lagerliste.xlsx` |
| `EXCEL_INVENTORY_WORKSHEET` | Name des Lagerbestand-Sheets | `Lagerliste` |
| `EXCEL_TRANSACTIONS_WORKSHEET` | Name des Transaktionen-Sheets | `Transaktionen` |

## Wichtig

1. **Client Secret läuft ab nach 24 Monaten** - Neues erstellen in Azure Portal
2. **Transaktionen-Worksheet** muss in der Excel-Datei erstellt werden
3. Pfad zur Excel-Datei muss mit `/` beginnen

## Test-Befehl

```bash
pnpm run test-excel
```
