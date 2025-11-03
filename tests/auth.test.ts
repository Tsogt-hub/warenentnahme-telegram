import { describe, it, expect } from "vitest";
import {
  isAllowedChatId,
  isAllowedUserId,
  authorizeRequest,
  applyAuthorization,
} from "../src/auth.js";
import type { ParserOutput } from "../src/schema.js";

describe("Auth Guards", () => {
  const allowedChatIds = [-5025798709, 123456789];
  const allowedUserIds = [6377811171, 987654321];

  describe("isAllowedChatId", () => {
    it("sollte erlaubte Chat-ID erkennen", () => {
      expect(isAllowedChatId(-5025798709, allowedChatIds)).toBe(true);
    });

    it("sollte nicht-erlaubte Chat-ID ablehnen", () => {
      expect(isAllowedChatId(999999, allowedChatIds)).toBe(false);
    });
  });

  describe("isAllowedUserId", () => {
    it("sollte erlaubte User-ID erkennen", () => {
      expect(isAllowedUserId(6377811171, allowedUserIds)).toBe(true);
    });

    it("sollte nicht-erlaubte User-ID ablehnen", () => {
      expect(isAllowedUserId(999999, allowedUserIds)).toBe(false);
    });
  });

  describe("authorizeRequest", () => {
    it("sollte erlaubten Chat + User autorisieren", () => {
      const result = authorizeRequest(
        -5025798709,
        6377811171,
        allowedChatIds,
        allowedUserIds
      );
      expect(result.authorized).toBe(true);
    });

    it("sollte nicht-erlaubten Chat ablehnen", () => {
      const result = authorizeRequest(999999, 6377811171, allowedChatIds, allowedUserIds);
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("unauthorized");
    });

    it("sollte erlaubten Chat ohne User-ID akzeptieren (Group)", () => {
      const result = authorizeRequest(
        -5025798709,
        undefined,
        allowedChatIds,
        allowedUserIds
      );
      expect(result.authorized).toBe(true);
    });
  });

  describe("applyAuthorization", () => {
    it("sollte Authorization auf Parser-Output anwenden", () => {
      const output: ParserOutput = {
        action: "withdraw",
        item_name: "Test",
        sku: null,
        qty: 1,
        unit: "Stk",
        location: null,
        project_id: null,
        project_label: null,
        reason: null,
        person: null,
        notes: null,
        authorized: false,
        duplicate: false,
        chat_id: -5025798709,
        message_id: 1,
        telegram_user_id: 6377811171,
        telegram_username: "testuser",
        request_id: "-5025798709-1",
        timestamp_iso: new Date().toISOString(),
        confidence: 0.9,
        needs_clarification: false,
        clarifying_question: null,
        confirmation_text: "Test",
      };

      const result = applyAuthorization(output, allowedChatIds, allowedUserIds);
      expect(result.authorized).toBe(true);
      expect(result.action).toBe("withdraw");
    });

    it("sollte nicht-autorisierte Requests ablehnen", () => {
      const output: ParserOutput = {
        action: "withdraw",
        item_name: "Test",
        sku: null,
        qty: 1,
        unit: "Stk",
        location: null,
        project_id: null,
        project_label: null,
        reason: null,
        person: null,
        notes: null,
        authorized: false,
        duplicate: false,
        chat_id: 999999,
        message_id: 1,
        telegram_user_id: 999999,
        telegram_username: "unauthorized",
        request_id: "999999-1",
        timestamp_iso: new Date().toISOString(),
        confidence: 0.9,
        needs_clarification: false,
        clarifying_question: null,
        confirmation_text: "Test",
      };

      const result = applyAuthorization(output, allowedChatIds, allowedUserIds);
      expect(result.authorized).toBe(false);
      expect(result.action).toBe("reject");
      expect(result.reason).toBe("unauthorized");
    });
  });
});

