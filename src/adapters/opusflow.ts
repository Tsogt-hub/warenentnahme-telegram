import type { ParserOutput } from "../schema.js";
import type { Logger } from "pino";

/**
 * OpusFlow Adapter (No-Op + TODO)
 * TODO: Implementiere OpusFlow API-Integration
 * - API Endpoint + Token aus ENV
 * - REST-Call für Lagerbewegung
 */
export async function writeToOpusFlow(
  output: ParserOutput,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> {
  logger?.info({ output }, "OpusFlow adapter: TODO - Implementierung ausstehend");

  // No-Op für jetzt
  return {
    success: true,
  };
}

