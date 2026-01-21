import OpenAI from "openai";
import type { ParserOutput } from "./schema.js";
import { ParserOutputSchema } from "./schema.js";
import type { Logger } from "pino";

const PARSER_PROMPT = `Du bist ein intelligenter Warehouse-Management-Parser für Lagerbewegungen. Deine Aufgabe: Unstrukturierte Telegram-Nachrichten in strukturierte Transaktionen konvertieren.

WICHTIG:
- Verwende Fuzzy-Matching (erkenne auch bei Tippfehlern)
- Wenn unsicher: Setze confidence auf "medium" oder "low"
- IMMER nur valides JSON zurückgeben, keine Prosa!
- Erkenne sowohl Entnahmen als auch Rückgaben/Eingänge
- **MEHRERE ARTIKEL**: Wenn eine Nachricht mehrere Artikel enthält (z.B. "3 Module 4 kabelkanäle 1 leiter 4 M8 Schrauben"), gib ein Array mit EINER Transaktion pro Artikel zurück!

Sicherheit:
- allowed_chat_ids: [-5025798709]  // Gebharts Lager KI Group
- allowed_user_ids: [6377811171]   // Tsogt Nandin-Erdene
- Unbekannt -> authorized=false, action="reject", reason="unauthorized".
- Dedupliziere über request_id = chat_id + "-" + message_id; setze duplicate=true bei Wiederholung.

ENTNAHME-TRIGGER (withdraw):
Deutsch: entnimm, nimm, raus, minus, minus, weg, verbraucht, verwendet, genommen, entnommen, abgezogen
English: removed, taken out, out, minus, gone, consumed, used, picked, withdrew, taken
Symbole: -, minus

RÜCKGABE/EINGANG-TRIGGER (return):
Deutsch: zurück, rückgabe, erhalten, angekommen, bekommen, gekauft, eingehend, geliefert, rein, hereingekommen, reinbekommen
English: received, arrived, got, purchased, incoming, delivered, in, came in, got in, received
Symbole: +, plus

MENGE-FORMATE (alle erkennen):
"x5", "5x", "5 pcs", "5pcs", "5 kg", "5kg", "5m", "5 meter", "fünf", "5", "a5", "à5", "ca. 5", "~5"
Unklar ("mehrere", "some", "ein paar") -> qty: null, confidence: 0.3, needs_clarification: true

CONFIDENCE-LEVELS (0.0-1.0):
- 0.9-1.0 (high): Exakte Übereinstimmung, SKU vorhanden, klare Menge, klarer Ort
- 0.6-0.8 (medium): Kleine Tippfehler, ähnliche Begriffe, Menge vorhanden aber unklar
- 0.3-0.5 (low): Mehrere mögliche Matches, unsichere Erkennung, unklare Menge
- 0.0-0.2: Nicht erkennbar, starke Unsicherheit

FUZZY-MATCHING REGELN:
1. Exact Match: confidence 0.9+
2. Synonyme (z.B. "Kanal 30" = "Kabelkanal 30x30"): confidence 0.8
3. Tippfehler (1-2 Zeichen Unterschied): confidence 0.7
4. Ähnliche Begriffe (Levenshtein 80%+): confidence 0.6
5. Mehrdeutig/unbekannt: confidence 0.3, needs_clarification: true

Beispieleingaben (intelligentes Parsing):
- "Kanal 30 x5 removed" → SKU erkennen, quantity: 5, type: withdraw, confidence: 0.9
- "kabel kanal3030 3 pcs out" → Fuzzy-Match zu "Kabelkanal 30x30", quantity: 3, confidence: 0.8
- "M8 screw minus 2kg" → SKU: 1234, quantity: 2, unit: kg, confidence: 0.9
- "Schreiber 8 arrived" → SKU: 1235?, quantity: 8, type: return, confidence: 0.7 (medium)
- "orange tube 50 meter in" → SKU: 2001, quantity: 50, unit: m, type: return, confidence: 0.9
- "nimm 3x M8-Schrauben aus Regal A3 für Auftrag 1234" → SKU + Menge + Ort, confidence: 0.95
- "mehrere Kabel entfernt" → item_name: "Kabel", qty: null, confidence: 0.3, needs_clarification: true
- **"3 Module 4 kabelkanäle 1 leiter 4 M8 Schrauben"** → Array mit 4 Transaktionen:
  [{item: "Module", qty: 3}, {item: "kabelkanäle", qty: 4}, {item: "leiter", qty: 1}, {item: "M8 Schrauben", qty: 4}]
- **"entnimm 2x Leiter und 5 M8-Schrauben"** → Array mit 2 Transaktionen

Extrahiere Felder:
action (withdraw|return|adjust|new_item|reject), item_name, sku, qty (null bei unklar), unit, location,
project_id, project_label, reason, person, notes, authorized, duplicate,
chat_id, message_id, telegram_user_id, telegram_username, request_id, timestamp_iso,
confidence (0.0-1.0), needs_clarification (bool), clarifying_question, confirmation_text (DE kurz).

PARSING-REGELN (WICHTIG FÜR BENUTZERFREUNDLICHKEIT):
1) KEINE unnötigen Nachfragen! Wenn item_name aus Kontext erkennbar ist (auch bei Tippfehlern) → verwende es, auch ohne SKU.
2) SKU ist OPTIONAL - item_name ist ausreichend! Nur wenn BEIDES fehlt (kein Artikel erkennbar) → needs_clarification=true.
3) Intelligente Erkennung:
   - "Leiter" → item_name: "Leiter", sku: null (OK!)
   - "2x Leiter" → item_name: "Leiter", qty: 2, sku: null (OK!)
   - "Artikel-Nr" ohne weitere Info → needs_clarification: true
   - "nimm 3 M8-Schrauben" → item_name: "M8-Schrauben", qty: 3, sku: null (OK!)
4) Einheiten normalisieren: "x","stück","stk.","pcs","pcs" -> "Stk"; "meter","m" -> "m"; "kg" -> "kg"; "rolle(n)" -> "rolle"
5) confidence basierend auf: item_name klar (0.4), Menge klar (0.2), Ort klar (0.2), SKU vorhanden (+0.2) = max 1.0
6) confirmation_text Format (SKU nur wenn vorhanden):
   withdraw: "✓ Entnahme: {qty} {unit} {item_name}" (+ " (SKU {sku})" nur wenn sku vorhanden) (+ " aus {location}" nur wenn location vorhanden)
   return: "✓ Eingang: {qty} {unit} {item_name}" (+ " → {location}" nur wenn location vorhanden)
   adjust: "✓ Inventur: {item_name} → {qty} {unit}"
7) ALWAYS nur valides JSON nach Schema ausgeben, nichts anderes!

JSON-Schema (WICHTIG: Bei mehreren Artikeln gib ein Array zurück!):
Wenn EIN Artikel: Ein Objekt wie unten
Wenn MEHRERE Artikel: Array von Objekten, z.B. [{...}, {...}, {...}]

Einzelnes Objekt (oder Array-Element):
{
  "action": "withdraw|return|adjust|new_item|reject",
  "item_name": "string|null",
  "sku": "string|null",
  "qty": 0 (oder null wenn unklar),
  "unit": "Stk|m|kg|l|pack|set|rolle|karton|kiste|tüte|%" (NIEMALS null - verwende "Stk" als Default wenn unklar),
  "location": "string|null",
  "project_id": "string|null",
  "project_label": "string|null",
  "reason": "string|null",
  "person": "string|null",
  "notes": "string|null",
  "authorized": true,
  "duplicate": false,
  "chat_id": -5025798709,
  "message_id": 0,
  "telegram_user_id": 0,
  "telegram_username": "string|null",
  "request_id": "string",
  "timestamp_iso": "YYYY-MM-DDTHH:MM:SSZ",
  "confidence": 0.0,
  "needs_clarification": false,
  "clarifying_question": "string|null",
  "confirmation_text": "string" (NIEMALS null - verwende "✓ Verarbeitet" wenn unklar oder erstelle sinnvollen Text)
}

BEISPIEL für mehrere Artikel:
Input: "3 Module 4 kabelkanäle 1 leiter 4 M8 Schrauben"
Output: [
  {"action": "withdraw", "item_name": "Module", "qty": 3, "unit": "Stk", ...},
  {"action": "withdraw", "item_name": "kabelkanäle", "qty": 4, "unit": "m", ...},
  {"action": "withdraw", "item_name": "leiter", "qty": 1, "unit": "Stk", ...},
  {"action": "withdraw", "item_name": "M8 Schrauben", "qty": 4, "unit": "Stk", ...}
]

KRITISCH: 
- unit MUSS immer einen der Enum-Werte haben (Standard: "Stk" wenn unklar)
- confirmation_text MUSS immer ein String sein (mindestens "✓ Verarbeitet")
- Selbst bei sehr unklaren Eingaben (z.B. nur "Artikel-Nr") → action: "reject", unit: "Stk", confirmation_text: "❓ Unklare Eingabe. Bitte vollständige Entnahme mit Menge und Artikel angeben."
}`;

interface ParserConfig {
  apiKey: string; // OpenAI API Key
  model?: string;
  timeout?: number;
  maxRetries?: number;
  logger?: Logger;
}

// OpenAI Model Default (empfohlen für strukturierte Ausgaben)
// GPT-4o-mini: Sehr günstig (~$0.15/$0.60 pro 1M tokens), sehr gut für strukturiertes Parsing
const DEFAULT_GPT_MODEL = "gpt-4o-mini";

/**
 * Exponential Backoff Retry
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalisiert Einheiten gemäß Schema
 */
export function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();
  const mapping: Record<string, string> = {
    x: "Stk",
    stück: "Stk",
    "stk.": "Stk",
    stk: "Stk",
    meter: "m",
    m: "m",
    "rolle(n)": "rolle",
    rolle: "rolle",
    kg: "kg",
    l: "l",
    pack: "pack",
    set: "set",
    karton: "karton",
    kiste: "kiste",
    tüte: "tüte",
    "%": "%",
  };

  return mapping[normalized] || "Stk";
}

/**
 * Ruft LLM auf und parst JSON-Response
 */
export async function parseWithLLM(
  text: string,
  metadata: {
    chatId: number;
    messageId: number;
    userId?: number;
    username?: string;
  },
  config: ParserConfig
): Promise<ParserOutput> {
  const { apiKey, model = DEFAULT_GPT_MODEL, timeout = 30000, maxRetries = 3, logger } = config;

  const openai = new OpenAI({
    apiKey,
    timeout,
  });

  const requestId = `${metadata.chatId}-${metadata.messageId}`;
  const timestampIso = new Date().toISOString();

  const userPrompt = `Text: "${text}"
Metadaten:
- chat_id: ${metadata.chatId}
- message_id: ${metadata.messageId}
- telegram_user_id: ${metadata.userId || "null"}
- telegram_username: ${metadata.username || "null"}
- request_id: ${requestId}
- timestamp_iso: ${timestampIso}

WICHTIG: 
- Wenn die Nachricht MEHRERE Artikel enthält (z.B. "3 Module und 1 Leiter"), gib ein Array zurück: [{"item_name": "Module", "qty": 3, ...}, {"item_name": "Leiter", "qty": 1, ...}]
- Wenn nur EIN Artikel: Ein einzelnes Objekt: {"item_name": "Module", "qty": 3, ...}

Gib ausschließlich valides JSON zurück (keine Markdown, kein Text davor/dahinter):`;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: PARSER_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1, // Niedrig für deterministisches Parsing
        max_tokens: 4096, // Mehr Tokens für Arrays mit mehreren Artikeln
        // KEIN response_format: json_object - das würde Arrays verhindern!
        // Wir lassen GPT selbst entscheiden, ob Objekt oder Array zurückzugeben ist
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Empty response from GPT");
      }

      // Entferne Markdown-Code-Blöcke falls vorhanden
      let jsonString = content;
      if (content.startsWith("```json")) {
        jsonString = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (content.startsWith("```")) {
        jsonString = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // Striktes JSON-Parsing
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch (_e) {
        throw new Error(`Invalid JSON response: ${jsonString}`);
      }

      // Unterstütze sowohl einzelnes Objekt als auch Array
      let parsedArray: ParserOutput[];
      if (Array.isArray(parsed)) {
        // Array von Transaktionen
        parsedArray = parsed.map((item) => ParserOutputSchema.parse(item));
      } else {
        // Einzelnes Objekt
        parsedArray = [ParserOutputSchema.parse(parsed)];
      }

      logger?.debug(
        { count: parsedArray.length, items: parsedArray.map((p) => p.item_name) },
        "GPT parse successful"
      );
      
      // Für Rückwärtskompatibilität: wenn nur ein Element, gib es direkt zurück
      // Wenn mehrere, gib Array zurück (wird in Route behandelt)
      return parsedArray.length === 1 ? parsedArray[0] : (parsedArray as any);
    } catch (error) {
      lastError = error as Error;
      logger?.warn(
        { attempt: attempt + 1, maxRetries, error: lastError.message },
        "GPT parse attempt failed"
      );

      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await sleep(backoffMs);
      }
    }
  }

  // Fallback bei allen Retries fehlgeschlagen
  logger?.error({ error: lastError }, "All GPT parse attempts failed");
  throw new Error(
    `Failed to parse after ${maxRetries} attempts: ${lastError?.message}`
  );
}

