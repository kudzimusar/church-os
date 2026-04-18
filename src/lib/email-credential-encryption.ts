/**
 * AES-256-GCM encryption for external email credentials (OAuth tokens, IMAP passwords).
 * Key: process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY (32 bytes, base64-encoded).
 * Format: base64(iv):base64(authTag):base64(ciphertext)
 * Node.js version — used in Server Actions only.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function getKey(): Buffer {
  const keyB64 = process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY;
  if (!keyB64) throw new Error('EMAIL_CREDENTIAL_ENCRYPTION_KEY is not set');
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) throw new Error('EMAIL_CREDENTIAL_ENCRYPTION_KEY must be 32 bytes');
  return key;
}

export function encryptCredential(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptCredential(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
