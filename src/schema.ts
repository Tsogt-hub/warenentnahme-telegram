import { z } from "zod";

// Telegram Update Schema (erweitert für Text und Voice Messages)
export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      date: z.number(),
      text: z.string().optional(),
      voice: z
        .object({
          file_id: z.string(),
          duration: z.number(),
          mime_type: z.string().optional(),
          file_size: z.number().optional(),
        })
        .optional(),
      from: z
        .object({
          id: z.number(),
          username: z.string().optional(),
          first_name: z.string().optional(),
        })
        .optional(),
      chat: z.object({
        id: z.number(),
        type: z.enum(["private", "group", "supergroup", "channel"]),
        title: z.string().optional(),
      }),
      forward_from: z
        .object({
          id: z.number(),
          username: z.string().optional(),
          first_name: z.string().optional(),
        })
        .optional(),
      forward_from_chat: z
        .object({
          id: z.number(),
          type: z.enum(["private", "group", "supergroup", "channel"]),
          title: z.string().optional(),
        })
        .optional(),
    })
    .passthrough(), // Erlaube zusätzliche Felder (z.B. forward_from)
});

export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;

// Parser Output Schema
export const UnitSchema = z.enum([
  "Stk",
  "m",
  "kg",
  "l",
  "pack",
  "set",
  "rolle",
  "karton",
  "kiste",
  "tüte",
  "%",
]);

export const ActionSchema = z.enum([
  "withdraw",
  "return",
  "adjust",
  "new_item",
  "reject",
]);

export const ParserOutputSchema = z.object({
  action: ActionSchema,
  item_name: z.string().nullable(),
  sku: z.string().nullable(),
  qty: z.number().min(0).nullable(), // Null erlauben für unklare Mengen
  unit: UnitSchema.nullable().default("Stk"), // Null erlauben, Default "Stk"
  location: z.string().nullable(),
  project_id: z.string().nullable(),
  project_label: z.string().nullable(),
  reason: z.string().nullable(),
  person: z.string().nullable(),
  notes: z.string().nullable(),
  authorized: z.boolean(),
  duplicate: z.boolean(),
  chat_id: z.number(),
  message_id: z.number(),
  telegram_user_id: z.number(),
  telegram_username: z.string().nullable(),
  request_id: z.string(),
  timestamp_iso: z.string(),
  confidence: z.number().min(0).max(1),
  needs_clarification: z.boolean(),
  clarifying_question: z.string().nullable(),
  confirmation_text: z.string().nullable().default("✓ Verarbeitet"), // Null erlauben, Default Text
});

export type ParserOutput = z.infer<typeof ParserOutputSchema>;

