# 📊 Excel-Anbindung für Lager-Bot

## Anleitung für den Kunden

Diese Anleitung erklärt, wie Sie die Excel-Datei mit dem automatischen Lager-Bot verbinden.

---

## 📋 Übersicht

Der Lager-Bot kann automatisch:
- ✅ Entnahmen aus dem Lagerbestand abziehen
- ✅ Rückgaben zum Bestand hinzufügen
- ✅ Alle Transaktionen protokollieren
- ✅ Warnungen bei niedrigem Bestand senden

Dafür brauchen wir eine sichere Verbindung zwischen dem Bot und Ihrer Excel-Datei in OneDrive/SharePoint.

---

## Teil 1: Excel-Datei vorbereiten (5 Minuten)

### 1.1 Ihre bestehende Lagerliste

Ihre Excel-Datei sollte folgende Spalten haben (Blatt "Lagerliste"):

| Spalte | Name | Beispiel |
|--------|------|----------|
| A | Lagerplatz (A-Y Innen) | Z0005 |
| B | Z (Außen) | F0002 |
| C | Interne Artikelnummer | 80001 |
| D | Externe Artikelnummer | ILEL 0029 ML |
| E | Bezeichnung | Einbauleuchte Großer Topf... |
| F | Hersteller | RP, LTS, Siemens |
| G | Bestand Lager Innen | 65 |
| H | Bestand Lager Außen | 4 |
| I | Gesamtbestand | (Formel: =G+H) |

### 1.2 Neues Blatt "Transaktionen" erstellen

Erstellen Sie ein neues Tabellenblatt mit dem Namen **"Transaktionen"** und folgenden Spalten in Zeile 1:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Aktion | Artikelname | Artikelnummer | Menge | Einheit | Lager | Projekt | Grund | Person | Telegram-User | Request-ID |

### 1.3 Datei in OneDrive hochladen

1. Öffnen Sie [onedrive.com](https://onedrive.live.com) oder Ihre SharePoint-Site
2. Laden Sie die Excel-Datei hoch (oder verschieben Sie sie dorthin)
3. Merken Sie sich den Speicherort

---

## Teil 2: App-Zugang einrichten (10 Minuten)

Damit der Bot sicher auf Ihre Excel-Datei zugreifen kann, müssen wir eine "App-Registrierung" in Microsoft Azure erstellen. Das ist wie ein spezieller Schlüssel nur für diesen Bot.

### 2.1 Azure Portal öffnen

1. Gehen Sie zu: **https://portal.azure.com**
2. Melden Sie sich mit Ihrem Microsoft 365 Konto an

### 2.2 App registrieren

1. Suchen Sie oben in der Suchleiste nach: **"App registrations"** (oder "App-Registrierungen")
2. Klicken Sie auf das Ergebnis
3. Klicken Sie auf **"+ New registration"** (Neue Registrierung)

![App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/media/quickstart-register-app/portal-02-app-reg-01.png)

4. Füllen Sie das Formular aus:
   - **Name:** `Lager-Bot`
   - **Unterstützte Kontotypen:** "Nur Konten in diesem Organisationsverzeichnis"
   - **Redirect URI:** Leer lassen (nicht benötigt)

5. Klicken Sie auf **"Register"** (Registrieren)

### 2.3 Wichtige Werte notieren

Nach der Registrierung sehen Sie die Übersichtsseite. **Notieren Sie diese zwei Werte:**

```
Application (client) ID:  ________________________________

Directory (tenant) ID:    ________________________________
```

Diese finden Sie auf der Übersichtsseite der App.

### 2.4 Client Secret erstellen

1. Klicken Sie links im Menü auf **"Certificates & secrets"**
2. Klicken Sie auf **"+ New client secret"**
3. Füllen Sie aus:
   - **Description:** `Lager-Bot Secret`
   - **Expires:** 24 months (24 Monate)
4. Klicken Sie auf **"Add"**

⚠️ **WICHTIG:** Kopieren Sie sofort den **"Value"** (Wert)! Er wird nur einmal angezeigt!

```
Client Secret Value:      ________________________________
```

### 2.5 Berechtigungen hinzufügen

1. Klicken Sie links im Menü auf **"API permissions"**
2. Klicken Sie auf **"+ Add a permission"**
3. Wählen Sie **"Microsoft Graph"**
4. Wählen Sie **"Application permissions"** (nicht Delegated!)
5. Suchen Sie nach **"Files"** und aktivieren Sie:
   - ☑️ `Files.ReadWrite.All`
6. Klicken Sie auf **"Add permissions"**

### 2.6 Admin-Zustimmung erteilen

1. Zurück auf der "API permissions" Seite
2. Klicken Sie auf den Button **"Grant admin consent for [Ihr Unternehmen]"**
3. Bestätigen Sie mit **"Yes"**

✅ Sie sollten jetzt einen grünen Haken bei der Berechtigung sehen.

---

## Teil 3: Excel-Datei Link kopieren

### Option A: OneDrive

1. Öffnen Sie OneDrive im Browser
2. Navigieren Sie zu Ihrer Excel-Datei
3. Klicken Sie mit der rechten Maustaste auf die Datei
4. Wählen Sie **"Details"** oder **"Eigenschaften"**
5. Kopieren Sie den **Pfad** oder die **URL**

### Option B: SharePoint

1. Öffnen Sie die SharePoint-Site
2. Navigieren Sie zur Excel-Datei
3. Kopieren Sie die URL aus der Adresszeile

```
Excel-Datei Link:         ________________________________
```

---

## Teil 4: Werte an den Entwickler senden

Bitte senden Sie diese 4 Werte sicher an Ihren Entwickler:

```
╔══════════════════════════════════════════════════════════════╗
║  ZUGANGSDATEN FÜR LAGER-BOT                                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Application (client) ID:                                 ║
║     ________________________________________________________║
║                                                              ║
║  2. Directory (tenant) ID:                                   ║
║     ________________________________________________________║
║                                                              ║
║  3. Client Secret Value:                                     ║
║     ________________________________________________________║
║                                                              ║
║  4. Excel-Datei Link/Pfad:                                   ║
║     ________________________________________________________║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

⚠️ **Sicherheitshinweis:** Senden Sie diese Daten nur über einen sicheren Kanal (z.B. verschlüsselte E-Mail, Signal, oder persönlich).

---

## ❓ Häufige Fragen

### Warum brauche ich das?

Damit der Telegram-Bot Ihre Excel-Datei lesen und aktualisieren kann, braucht er eine sichere Berechtigung. Die App-Registrierung ist wie ein Schlüssel, der nur dem Bot Zugang gibt - nicht Ihrem gesamten Konto.

### Ist das sicher?

Ja! Die App hat nur Zugriff auf Dateien (nicht auf E-Mails oder andere Daten). Sie können die Berechtigung jederzeit im Azure Portal widerrufen.

### Was kostet das?

Die App-Registrierung in Azure ist kostenlos. Sie benötigen nur ein aktives Microsoft 365 Abonnement.

### Kann ich die Berechtigung später entziehen?

Ja, jederzeit. Gehen Sie einfach zu Azure Portal → App registrations → Lager-Bot → Löschen.

---

## 🆘 Hilfe benötigt?

Bei Fragen wenden Sie sich an Ihren Entwickler oder IT-Administrator.

---

*Erstellt am: Januar 2026*
*Version: 1.0*
