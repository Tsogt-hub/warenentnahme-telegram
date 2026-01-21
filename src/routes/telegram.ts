import { Hono } from "hono";
import { Bot } from "grammy";
import type { TelegramUpdate, ParserOutput } from "../schema.js";
import { TelegramUpdateSchema } from "../schema.js";
import { parseWithLLM } from "../parser.js";
import { applyAuthorization } from "../auth.js";
import { IdempotencyBus } from "../bus.js";
import { createSheetsClientFromEnv } from "../adapters/sheets.js";
import { writeToTrello } from "../adapters/trello.js";
import { writeToOpusFlow } from "../adapters/opusflow.js";
import { createExcelClientFromEnv } from "../adapters/excel.js";
import { transcribeVoiceMessage } from "../transcribe.js";
import type { Logger } from "pino";

interface TelegramRouteConfig {
  botToken: string;
  openaiApiKey: string; // Jetzt OpenAI für Parsing UND Whisper
  allowedChatIds: number[];
  allowedUserIds: number[];
  outboundMode: "sheets" | "trello" | "opusflow" | "excel";
  logger: Logger;
}

// Client Caches (einmalig initialisiert)
let sheetsClient: Awaited<ReturnType<typeof createSheetsClientFromEnv>> | null = null;
let excelClient: Awaited<ReturnType<typeof createExcelClientFromEnv>> | null = null;

/**
 * Dispatcher für Outbound-Integration
 */
async function dispatchToOutbound(
  output: ParserOutput,
  mode: "sheets" | "trello" | "opusflow" | "excel",
  logger: Logger
): Promise<{
  success: boolean;
  error?: string;
  alertNeeded?: boolean;
  alertMessage?: string;
  inventoryUpdated?: boolean;
  newStock?: number;
}> {
  switch (mode) {
    case "sheets": {
      // Lazy-Load Sheets-Client
      if (!sheetsClient) {
        sheetsClient = await createSheetsClientFromEnv(logger);
      }
      if (!sheetsClient) {
        return { success: false, error: "Sheets-Client nicht initialisiert (fehlende ENV-Variablen)" };
      }
      return sheetsClient.write(output);
    }
    case "excel": {
      // Lazy-Load Excel-Client
      if (!excelClient) {
        excelClient = await createExcelClientFromEnv(logger);
      }
      if (!excelClient) {
        return { success: false, error: "Excel-Client nicht initialisiert (fehlende ENV-Variablen)" };
      }
      return excelClient.write(output);
    }
    case "trello":
      return writeToTrello(output, logger);
    case "opusflow":
      return writeToOpusFlow(output, logger);
    default:
      logger.warn({ mode }, "Unknown outbound mode");
      return { success: false, error: `Unknown mode: ${mode}` };
  }
}

export function createTelegramRoute(config: TelegramRouteConfig): Hono {
  const app = new Hono();
  const bus = new IdempotencyBus();
  const bot = new Bot(config.botToken);

  // Webhook-Endpoint
  app.post("/webhook", async (c) => {
    let chatId: number | undefined;
    try {
      const body = await c.req.json();
      config.logger.debug({ body }, "Webhook empfangen");

      const update = TelegramUpdateSchema.parse(body) as TelegramUpdate;
      
      // Prüfe ob Message vorhanden ist
      if (!update.message) {
        config.logger.debug({ update }, "Keine Message im Update");
        return c.json({ ok: true, message: "No message in update" });
      }

      chatId = update.message.chat.id;
      const messageId = update.message.message_id;
      const userId = update.message.from?.id;
      const username = update.message.from?.username;

      config.logger.info(
        {
          chatId: update.message.chat.id,
          messageId: update.message.message_id,
          userId: update.message.from?.id,
          text: update.message.text?.substring(0, 50),
          hasVoice: !!update.message.voice,
          isForwarded: !!(update.message as any).forward_from || !!(update.message as any).forward_from_chat,
          forwardFrom: (update.message as any).forward_from?.id || (update.message as any).forward_from_chat?.id,
        },
        "Telegram Update empfangen"
      );

      // Text oder Voice Message verarbeiten
      let text: string | undefined;

      // Debug: Logge alle verfügbaren Message-Typen
      config.logger.debug(
        {
          hasText: !!update.message.text,
          hasVoice: !!update.message.voice,
          messageKeys: Object.keys(update.message),
        },
        "Message-Typen Analyse"
      );

      if (update.message.text) {
        // Normale Text-Nachricht
        text = update.message.text;
        config.logger.info({ textLength: text.length }, "Text-Nachricht erkannt");
      } else if (update.message.voice) {
        // Voice Message - transkribieren
        config.logger.info(
          { 
            fileId: update.message.voice.file_id, 
            duration: update.message.voice.duration,
            mimeType: update.message.voice.mime_type,
            fileSize: update.message.voice.file_size,
          },
          "Voice Message empfangen, starte Transkription"
        );

        try {
          text = await transcribeVoiceMessage(update.message.voice.file_id, {
            openaiApiKey: process.env.OPENAI_API_KEY, // Whisper benötigt OpenAI API Key
            botToken: config.botToken,
            logger: config.logger,
          });

          // Prüfe ob Transkription leer ist
          if (!text || text.trim().length === 0) {
            config.logger.warn({ fileId: update.message.voice.file_id }, "Transkription ergab leeren Text");
            await bot.api.sendMessage(
              chatId,
              `❌ Die Sprachnachricht konnte nicht transkribiert werden (leer).\n\nBitte versuche es erneut oder schreibe die Nachricht als Text.`,
              { reply_to_message_id: messageId }
            );
            return c.json({ ok: false, error: "Empty transcription" }, 400);
          }

          config.logger.info(
            { transcribedText: text.substring(0, 100), textLength: text.length },
            "Voice Message erfolgreich transkribiert"
          );

          // Sende Zwischennachricht zur Bestätigung der Transkription
          try {
            await bot.api.sendMessage(
              chatId,
              `🎤 Sprachnachricht transkribiert:\n"${text.substring(0, 150)}${text.length > 150 ? "..." : ""}"\n\n⏳ Verarbeite...`,
              { reply_to_message_id: messageId }
            );
          } catch (msgError) {
            config.logger.warn({ error: msgError }, "Konnte Zwischennachricht nicht senden");
            // Weiterlaufen, Verarbeitung ist wichtiger
          }
        } catch (transcribeError) {
          const errorMsg = transcribeError instanceof Error ? transcribeError.message : String(transcribeError);
          config.logger.error({ error: errorMsg }, "Fehler bei Voice-Transkription");
          await bot.api.sendMessage(
            chatId,
            `❌ Fehler bei der Transkription der Sprachnachricht: ${errorMsg}\n\nBitte versuche es erneut oder schreibe die Nachricht als Text.`,
            { reply_to_message_id: messageId }
          );
          return c.json({ ok: false, error: "Transcription failed" }, 500);
        }
      } else {
        // Weder Text noch Voice
        config.logger.warn(
          {
            messageId,
            chatId,
            messageKeys: Object.keys(update.message),
            hasVoice: !!update.message.voice,
            hasText: !!update.message.text,
            isForwarded: !!(update.message as any).forward_from || !!(update.message as any).forward_from_chat,
          },
          "Keine Text- oder Voice-Nachricht erkannt, überspringe"
        );
        return c.json({ ok: true, message: "No text or voice message" });
      }

      if (!text) {
        config.logger.warn({ messageId }, "Kein Text nach Verarbeitung");
        return c.json({ ok: false, error: "No text to process" }, 400);
      }

      const requestId = `${chatId}-${messageId}`;

      // Idempotenz-Check
      if (bus.isDuplicate(requestId)) {
        config.logger.info({ requestId }, "Duplicate request ignored");
        await bot.api.sendMessage(chatId, "⚠️ Diese Nachricht wurde bereits verarbeitet.");
        return c.json({ ok: true, duplicate: true });
      }

      // LLM-Parser (kann einzelnes Objekt oder Array zurückgeben)
      const parsed = await parseWithLLM(
        text,
        { chatId, messageId, userId, username },
        {
          apiKey: config.openaiApiKey,
          logger: config.logger,
        }
      );

      // Normalisiere zu Array (für einheitliche Verarbeitung)
      const transactions = Array.isArray(parsed) ? parsed : [parsed];
      
      config.logger.info(
        { transactionCount: transactions.length },
        `Verarbeite ${transactions.length} Transaktion(en)`
      );

      // Bei mehreren Transaktionen: Sende sofort Zwischenstatus
      if (transactions.length > 1) {
        try {
          await bot.api.sendMessage(
            chatId,
            `📦 ${transactions.length} Artikel erkannt, verarbeite...`,
            { reply_to_message_id: messageId }
          );
        } catch (_e) {
          // Ignore, Verarbeitung ist wichtiger
        }
      }

      // Sammle alle Ergebnisse und Alerts
      const processedResults: Array<{
        success: boolean;
        confirmation: string;
        alert?: string;
      }> = [];
      const allAlerts: string[] = [];

      // Verarbeite jede Transaktion einzeln (sequentiell wegen Bestandsabhängigkeiten)
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const itemRequestId = `${requestId}-${i}`; // Eindeutige Request-ID pro Artikel

        // Authorization anwenden
        const authorized = applyAuthorization(
          transaction,
          config.allowedChatIds,
          config.allowedUserIds
        );

        // Duplicate-Flag setzen falls Idempotenz-Cache bereits Eintrag hat
        authorized.duplicate = bus.isDuplicate(itemRequestId);

        // Markiere als verarbeitet
        bus.markProcessed(itemRequestId, authorized);

        // Outbound-Integration
        if (authorized.authorized && !authorized.duplicate) {
          config.logger.info(
            {
              index: i + 1,
              total: transactions.length,
              action: authorized.action,
              item: authorized.item_name,
              qty: authorized.qty,
              mode: config.outboundMode,
            },
            "Starte Outbound-Integration"
          );

          const dispatchResult = await dispatchToOutbound(
            authorized,
            config.outboundMode,
            config.logger
          );

          if (!dispatchResult.success) {
            const errorMsg = dispatchResult.error || "Unbekannter Fehler";
            config.logger.error(
              { dispatchResult, authorized, error: errorMsg },
              "Outbound dispatch failed"
            );
            processedResults.push({
              success: false,
              confirmation: `❌ Fehler bei ${authorized.item_name || "Artikel"}: ${errorMsg}`,
            });
          } else {
            config.logger.info(
              {
                success: dispatchResult.success,
                inventoryUpdated: dispatchResult.inventoryUpdated,
                newStock: dispatchResult.newStock,
              },
              "Outbound dispatch erfolgreich"
            );

            const confirmation = authorized.needs_clarification && authorized.clarifying_question
              ? `❓ ${authorized.clarifying_question}`
              : authorized.confirmation_text || "✓ Verarbeitet";

            processedResults.push({
              success: true,
              confirmation,
            });

            // Sammle Alerts
            if (dispatchResult.alertNeeded && dispatchResult.alertMessage) {
              allAlerts.push(dispatchResult.alertMessage);
            }
          }
        } else {
          config.logger.warn(
            {
              authorized: authorized.authorized,
              duplicate: authorized.duplicate,
              reason: authorized.reason,
            },
            "Outbound-Integration übersprungen (nicht autorisiert oder Duplikat)"
          );
          processedResults.push({
            success: !authorized.authorized,
            confirmation: authorized.confirmation_text || "⚠️ Nicht autorisiert oder Duplikat",
          });
        }
      }

      // Erstelle zusammengefasste Bestätigung
      const successCount = processedResults.filter((r) => r.success).length;
      let replyText = "";
      
      if (transactions.length === 1) {
        // Einzelne Transaktion: normale Antwort
        replyText = processedResults[0].confirmation;
      } else {
        // Mehrere Transaktionen: Zusammenfassung
        replyText = `✓ ${successCount}/${transactions.length} Transaktionen erfolgreich:\n\n`;
        processedResults.forEach((result, idx) => {
          const item = transactions[idx].item_name || `Artikel ${idx + 1}`;
          replyText += `${idx + 1}. ${item}: ${result.confirmation}\n`;
        });
      }

      // Telegram-Reply
      try {
        // Alle Alerts zusammenfassen
        if (allAlerts.length > 0) {
          if (allAlerts.length === 1) {
            replyText += `\n\n${allAlerts[0]}`;
          } else {
            replyText += `\n\n🔔 ${allAlerts.length} Artikel mit niedrigem Bestand:\n`;
            allAlerts.forEach((alert, idx) => {
              replyText += `${idx + 1}. ${alert.replace("⚠️ Niedriger Bestand: ", "")}\n`;
            });
          }
        }

        await bot.api.sendMessage(chatId, replyText, {
          reply_to_message_id: messageId,
        });

        // Separate zusammengefasste Alert-Nachricht bei mehreren niedrigen Beständen
        if (allAlerts.length > 1) {
          try {
            let alertSummary = `🔔 BESTANDSALARM\n\nFolgende Artikel haben niedrigen Bestand:\n\n`;
            allAlerts.forEach((alert, idx) => {
              alertSummary += `${idx + 1}. ${alert}\n`;
            });
            alertSummary += `\n⚠️ Bitte nachbestellen!`;
            
            await bot.api.sendMessage(chatId, alertSummary, { parse_mode: "Markdown" });
          } catch (alertError) {
            config.logger.warn(
              { chatId, error: alertError },
              "Fehler beim Senden der Alert-Nachricht"
            );
          }
        }
      } catch (telegramError) {
        config.logger.error(
          { chatId, messageId, error: telegramError },
          "Fehler beim Senden der Telegram-Nachricht"
        );
        // Weiterlaufen, Request war erfolgreich verarbeitet
      }

      return c.json({ ok: true, transactions: transactions.length, successCount });
    } catch (error) {
      config.logger.error({ error }, "Telegram webhook error");
      
      // Versuche Fehlermeldung an User zu senden (falls möglich)
      if (chatId) {
        try {
          await bot.api.sendMessage(
            chatId,
            "❌ Fehler bei der Verarbeitung. Bitte versuche es später erneut."
          );
        } catch {
          // Ignoriere Fehler beim Error-Reply
        }
      }
      
      return c.json({ ok: false, error: String(error) }, 500);
    }
  });

  // Health-Check
  app.get("/health", (c) => {
    return c.json({
      ok: true,
      service: "telegram-webhook",
      timestamp: new Date().toISOString(),
      cacheSize: bus.size(),
    });
  });

  // Webhook-Info-Endpoint
  app.get("/webhook/info", async (c) => {
    try {
      const info = await bot.api.getWebhookInfo();
      return c.json({ ok: true, webhook: info });
    } catch (error) {
      return c.json({ ok: false, error: String(error) }, 500);
    }
  });

  return app;
}

