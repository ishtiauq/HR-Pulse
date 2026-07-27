const textEncoder = new TextEncoder();

function base64Encode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64Decode(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const combined = new Uint8Array(64);
  combined.set(salt);
  combined.set(new Uint8Array(derivedBits), 32);
  return base64Encode(combined);
}

export async function verifyPassword(password, storedHash) {
  try {
    const combined = base64Decode(storedHash);
    if (combined.length !== 64) {
      return storedHash === password;
    }
    const salt = combined.slice(0, 32);
    const storedKey = combined.slice(32);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    const derivedKey = new Uint8Array(derivedBits);
    if (derivedKey.length !== storedKey.length) return false;
    return derivedKey.every((byte, i) => byte === storedKey[i]);
  } catch {
    return storedHash === password;
  }
}
