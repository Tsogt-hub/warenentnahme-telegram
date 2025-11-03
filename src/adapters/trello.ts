import type { ParserOutput } from "../schema.js";
import type { Logger } from "pino";

/**
 * Trello Adapter (No-Op + TODO)
 * TODO: Implementiere Trello API-Integration
 * - API Key + Token aus ENV
 * - Board-ID aus ENV
 * - Card erstellen pro Bewegung
 */
export async function writeToTrello(
  output: ParserOutput,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> {
  logger?.info({ output }, "Trello adapter: TODO - Implementierung ausstehend");

  // No-Op für jetzt
  return {
    success: true,
  };
}

