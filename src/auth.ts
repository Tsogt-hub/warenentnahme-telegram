import type { ParserOutput } from "./schema.js";

/**
 * Prüft, ob Chat-ID erlaubt ist
 */
export function isAllowedChatId(
  chatId: number,
  allowedChatIds: number[]
): boolean {
  return allowedChatIds.includes(chatId);
}

/**
 * Prüft, ob User-ID erlaubt ist
 */
export function isAllowedUserId(
  userId: number,
  allowedUserIds: number[]
): boolean {
  return allowedUserIds.includes(userId);
}

/**
 * Autorisiert einen Request basierend auf Chat- und User-ID
 */
export function authorizeRequest(
  chatId: number,
  userId: number | undefined,
  allowedChatIds: number[],
  allowedUserIds: number[]
): { authorized: boolean; reason?: string } {
  const chatAllowed = isAllowedChatId(chatId, allowedChatIds);
  const userAllowed =
    userId !== undefined && isAllowedUserId(userId, allowedUserIds);

  // Gruppen-Chat: Wenn Chat-ID erlaubt, akzeptiere alle Nachrichten in dieser Gruppe
  // Privat-Chat: Wenn Chat-ID erlaubt UND User-ID erlaubt (oder User-ID optional wenn allowedUserIds leer)
  if (chatAllowed) {
    // Für Gruppen-Chats: Negative Chat-IDs = Gruppen
    if (chatId < 0) {
      // Gruppen-Chat: Alle Mitglieder dürfen schreiben
      return { authorized: true };
    } else {
      // Privat-Chat: Prüfe User-ID (oder erlaube wenn keine User-IDs konfiguriert)
      if (allowedUserIds.length === 0 || (userId !== undefined && userAllowed)) {
        return { authorized: true };
      }
    }
  }

  return {
    authorized: false,
    reason: "unauthorized",
  };
}

/**
 * Setzt Authorization-Flags im Parser-Output
 */
export function applyAuthorization(
  output: ParserOutput,
  allowedChatIds: number[],
  allowedUserIds: number[]
): ParserOutput {
  const authResult = authorizeRequest(
    output.chat_id,
    output.telegram_user_id,
    allowedChatIds,
    allowedUserIds
  );

  if (!authResult.authorized) {
    return {
      ...output,
      authorized: false,
      action: "reject",
      reason: authResult.reason || "unauthorized",
      confirmation_text: `❌ Zugriff verweigert: ${authResult.reason}`,
    };
  }

  return {
    ...output,
    authorized: true,
  };
}

