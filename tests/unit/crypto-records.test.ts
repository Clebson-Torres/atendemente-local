import { beforeAll, describe, expect, it } from "vitest";
import { decryptRecordContent, encryptRecordContent } from "@/lib/crypto/records";

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("record encryption", () => {
  it("encrypts and decrypts textual notes", () => {
    const content = "Resumo sensivel do atendimento.";
    const encrypted = encryptRecordContent(content);

    expect(encrypted.encryptedPayload).not.toContain(content);
    expect(decryptRecordContent(encrypted)).toBe(content);
  });
});
