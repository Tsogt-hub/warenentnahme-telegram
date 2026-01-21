# Railway Projekt verlinken

## 🔗 Problem: `railway init` benötigt interaktive Eingabe

Falls `railway init` nicht funktioniert, verwende `railway link`.

## 📋 Schritt-für-Schritt

### Option 1: Projekt aus Liste auswählen

1. **Liste Projekte:**
   ```bash
   railway list
   ```

2. **Linke Projekt:**
   ```bash
   railway link <project-name>
   ```
   Oder:
   ```bash
   railway link <project-id>
   ```

### Option 2: Projekt-ID aus Dashboard

1. **Railway Dashboard:**
   - Gehe zu deinem Empty Project
   - Kopiere die Projekt-ID aus der URL
   - Oder: Settings → Project ID

2. **Linke Projekt:**
   ```bash
   railway link <project-id>
   ```

### Option 3: Projekt erstellen und linken

1. **Erstelle Projekt im Dashboard:**
   - Railway Dashboard → New Project → Empty Project

2. **Kopiere Projekt-ID:**
   - Aus der URL oder Settings

3. **Linke:**
   ```bash
   railway link <project-id>
   ```

## ✅ Nach erfolgreichem Link

Dann deploye:
```bash
railway up
```

## 💡 Tipp

Projekt-Status prüfen:
```bash
railway status
```

Sollte Projekt-Informationen zeigen.

