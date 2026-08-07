const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function deriveAesKey(material) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(material));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptJson(value, keyMaterial) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(keyMaterial);
  const plaintext = textEncoder.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return JSON.stringify({
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext))
  });
}

export async function decryptJson(payload, keyMaterial) {
  const parsed = JSON.parse(payload);
  if (!parsed?.iv || !parsed?.data) return null;
  const key = await deriveAesKey(keyMaterial);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.data)
  );
  return JSON.parse(textDecoder.decode(new Uint8Array(decrypted)));
}
