import crypto from "node:crypto";
import { getRequiredEnv } from "@/lib/env";

export type EncryptedRecordPayload = {
  encryptedPayload: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

const KEY_VERSION = 1;

function getEncryptionKey() {
  const rawKey = getRequiredEnv("APP_ENCRYPTION_KEY");
  const key = Buffer.from(rawKey, "base64");

  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }

  return key;
}

export function encryptRecordContent(content: string): EncryptedRecordPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedPayload: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyVersion: KEY_VERSION,
  };
}

export function decryptRecordContent(payload: EncryptedRecordPayload) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedPayload, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
