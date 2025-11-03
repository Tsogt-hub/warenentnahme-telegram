import "dotenv/config";
import { serve } from "@hono/node-server";
import pino from "pino";
import { createTelegramRoute } from "./routes/telegram.js";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// ENV-Variablen laden
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const allowedChatIds = process.env.ALLOWED_CHAT_IDS?.split(",").map(Number) || [];
const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [];
const outboundMode = (process.env.OUTBOUND_MODE || "sheets") as
  | "sheets"
  | "trello"
  | "opusflow";
const port = Number(process.env.PORT) || 3000;

// Validierung
if (!botToken) {
  logger.error("TELEGRAM_BOT_TOKEN fehlt");
  process.exit(1);
}

if (!openaiApiKey) {
  logger.error("OPENAI_API_KEY fehlt (benötigt für GPT Parsing und Whisper Transkription)");
  process.exit(1);
}

if (allowedChatIds.length === 0 && allowedUserIds.length === 0) {
  logger.warn("Keine ALLOWED_CHAT_IDS oder ALLOWED_USER_IDS gesetzt");
}

// App erstellen
const app = createTelegramRoute({
  botToken,
  openaiApiKey,
  allowedChatIds,
  allowedUserIds,
  outboundMode,
  logger,
});

// Server starten
logger.info({ port, outboundMode }, "Server startet");

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info({ url: `http://localhost:${info.port}` }, "Server läuft");
  }
);

