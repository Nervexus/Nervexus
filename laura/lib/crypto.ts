import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM for anything sensitive at rest (vault entries now; OAuth
// refresh tokens in a later phase). The key never touches the database --
// it only ever lives in the server's env, so a stolen DB file alone isn't
// enough to read a vault entry.
function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32"
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters).");
  }
  return key;
}

export type EncryptedValue = {
  cipherText: string;
  iv: string;
  authTag: string;
};

export function encrypt(plainText: string): EncryptedValue {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const cipherText = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return {
    cipherText: cipherText.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decrypt(value: EncryptedValue): string {
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  const plainText = Buffer.concat([
    decipher.update(Buffer.from(value.cipherText, "base64")),
    decipher.final(),
  ]);
  return plainText.toString("utf8");
}
