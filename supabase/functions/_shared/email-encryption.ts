/**
 * AES-256-GCM encryption for email credentials — Deno/Edge Function version.
 * Uses crypto.subtle (Web Crypto API available in Deno).
 * Format: base64(iv):base64(authTag):base64(ciphertext)
 */

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function bytesToB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function getKey(): Promise<CryptoKey> {
  const keyB64 = Deno.env.get('EMAIL_CREDENTIAL_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('EMAIL_CREDENTIAL_ENCRYPTION_KEY is not set');
  const keyBytes = b64ToBytes(keyB64);
  if (keyBytes.length !== 32) throw new Error('Key must be 32 bytes');
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptCredential(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  // AES-GCM in Web Crypto appends authTag to ciphertext (last 16 bytes)
  const data = new Uint8Array(encrypted);
  const ciphertext = data.slice(0, data.length - 16);
  const authTag = data.slice(data.length - 16);
  return `${bytesToB64(iv)}:${bytesToB64(authTag)}:${bytesToB64(ciphertext)}`;
}

export async function decryptCredential(cipher: string): Promise<string> {
  const key = await getKey();
  const parts = cipher.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const iv = b64ToBytes(parts[0]);
  const authTag = b64ToBytes(parts[1]);
  const ciphertext = b64ToBytes(parts[2]);
  // Reassemble: ciphertext + authTag (Web Crypto expects them concatenated)
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}
