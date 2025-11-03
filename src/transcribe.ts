/**
 * Speech-to-Text Transkription für Telegram Voice Messages
 * Nutzt OpenAI Whisper API für Audio-Transkription
 * 
 * HINWEIS: Claude API unterstützt keine Audio-Verarbeitung.
 * Daher nutzen wir OpenAI Whisper nur für die Transkription.
 * Das transkribierte Ergebnis wird dann mit Claude API geparst.
 */

import OpenAI from "openai";
import type { Logger } from "pino";
import { Bot } from "grammy";

interface TranscribeConfig {
  openaiApiKey?: string; // OpenAI API Key für Whisper (optional, kann auch in ENV sein)
  botToken: string;
  logger?: Logger;
}

/**
 * Lädt eine Telegram-Datei herunter
 */
async function downloadTelegramFile(
  bot: Bot,
  fileId: string,
  logger?: Logger
): Promise<Buffer> {
  try {
    // Hole File-Info
    const file = await bot.api.getFile(fileId);
    const filePath = file.file_path;

    // Download von Telegram Server
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;
    
    logger?.info({ fileId, filePath, url: fileUrl }, "Lade Voice Message herunter");

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Fehler beim Download: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger?.error({ error, fileId }, "Fehler beim Herunterladen der Voice Message");
    throw error;
  }
}

/**
 * Transkribiert Voice Message mit OpenAI Whisper API
 * 
 * WARUM OpenAI Whisper?
 * Claude API unterstützt keine Audio-Verarbeitung.
 * Whisper ist speziell für Speech-to-Text entwickelt und sehr genau.
 * Das transkribierte Ergebnis wird dann normal mit Claude API geparst.
 */
export async function transcribeVoiceMessage(
  fileId: string,
  config: TranscribeConfig
): Promise<string> {
  const { openaiApiKey, botToken, logger } = config;

  const bot = new Bot(botToken);
  
  // OpenAI API Key aus Config oder ENV
  const apiKey = openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY fehlt. " +
      "Claude API unterstützt keine Audio-Verarbeitung, daher benötigen wir OpenAI Whisper für die Transkription. " +
      "Bitte setze OPENAI_API_KEY in .env (kostenlos erhältlich unter https://platform.openai.com/api-keys)"
    );
  }

  const openai = new OpenAI({
    apiKey,
    timeout: 60000, // 60 Sekunden für Audio-Verarbeitung
  });

  try {
    logger?.info({ fileId }, "Starte Transkription der Voice Message mit Whisper");

    // 1. Lade Audio-Datei herunter
    const audioBuffer = await downloadTelegramFile(bot, fileId, logger);

    logger?.debug({ fileSize: audioBuffer.length }, "Audio-Datei heruntergeladen");

    // 2. Erstelle File für Whisper API
    // OpenAI SDK benötigt File, Blob, oder ReadableStream
    // Node.js 20+ hat File API verfügbar
    const audioFile = new File([audioBuffer], "voice.ogg", { type: "audio/ogg" });
    
    // 3. Transkribiere mit Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "de", // Deutsch
      response_format: "text",
    });

    // Whisper gibt direkt den Text zurück wenn response_format: "text"
    const transcribedText = typeof transcription === "string" 
      ? transcription.trim()
      : (transcription as any).text?.trim() || String(transcription).trim();

    logger?.info(
      { 
        fileId, 
        textLength: transcribedText.length, 
        preview: transcribedText.substring(0, 50) 
      },
      "Voice Message erfolgreich transkribiert"
    );

    return transcribedText;
  } catch (error) {
    logger?.error({ error, fileId }, "Fehler bei Transkription");
    throw new Error(
      `Transkription fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

