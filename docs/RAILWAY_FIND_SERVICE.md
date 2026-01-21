# Railway Service finden/erstellen

## 🔍 Problem: Kein "New Service" Button sichtbar

Railway hat verschiedene Interfaces. Hier sind die Möglichkeiten:

## 📋 Option 1: Service im Dashboard finden

1. **Gehe zu Railway Dashboard:**
   - https://railway.app/dashboard
   - Klicke auf Projekt: `prolific-dedication`

2. **Services finden:**
   - Im Projekt-Dashboard siehst du eine Liste von Services
   - Jeder Service hat einen Namen (z.B. "web", "api", "service")
   - Klicke auf einen Service, um Details zu sehen

3. **Service-Namen kopieren:**
   - Der Service-Name steht oben im Dashboard
   - Oder in der URL: `railway.app/project/.../service/...`

4. **Service verlinken:**
   ```bash
   railway service <service-name>
   ```

## 📋 Option 2: Service über "Deploy" erstellen

1. **Im Projekt-Dashboard:**
   - Klicke auf "Deploy" oder "Deploy Now" Button
   - Railway erstellt automatisch einen Service
   - Oder: "New Deployment" Button

2. **Service wird automatisch erstellt:**
   - Railway erstellt einen Service beim ersten Deployment
   - Service-Name ist meist der Projekt-Name oder "web"

## 📋 Option 3: Über "New" Button

1. **Im Projekt-Dashboard:**
   - Suche nach "New" Button (oben rechts)
   - Oder: "+" Button
   - Oder: "Add Service" Button

2. **Wähle:**
   - "Empty Service"
   - "Web Service"
   - Oder: "GitHub Repo"

## 📋 Option 4: Service direkt verlinken (wenn bekannt)

Falls du einen Service-Namen kennst:

```bash
railway service <service-name>
railway up
```

## 💡 Alternative: Railway erstellt automatisch

Wenn du `railway up` ausführst, erstellt Railway manchmal automatisch einen Service:

```bash
railway up
```

Railway fragt dann nach Service-Name oder erstellt einen automatisch.

## 🔍 Service-Namen finden

Im Railway Dashboard:
- Service-Name steht oben bei Service-Details
- Oder in der URL: `/service/<service-name>`
- Oder: Liste aller Services im Projekt-Überblick

## ✅ Nach Service-Erstellung

```bash
railway service <service-name>
railway up
```

Deployt Code zum Service.

