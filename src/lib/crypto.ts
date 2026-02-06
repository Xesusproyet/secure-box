/**
 * File encryption/decryption utilities using Web Crypto API
 * Uses AES-GCM for secure symmetric encryption
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a file with the given password
 * Returns encrypted data with salt and IV prepended
 */
export async function encryptFile(
  file: File,
  password: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);
  
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  onProgress?.(20);
  
  const key = await deriveKey(password, salt);
  
  onProgress?.(30);
  
  const fileBuffer = await file.arrayBuffer();
  
  onProgress?.(50);
  
  // Create metadata header (filename + type)
  const metadata = JSON.stringify({
    name: file.name,
    type: file.type,
  });
  const metadataBytes = new TextEncoder().encode(metadata);
  const metadataLength = new Uint32Array([metadataBytes.length]);
  
  // Combine metadata length + metadata + file content
  const dataToEncrypt = new Uint8Array(
    4 + metadataBytes.length + fileBuffer.byteLength
  );
  dataToEncrypt.set(new Uint8Array(metadataLength.buffer), 0);
  dataToEncrypt.set(metadataBytes, 4);
  dataToEncrypt.set(new Uint8Array(fileBuffer), 4 + metadataBytes.length);
  
  onProgress?.(70);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    dataToEncrypt
  );
  
  onProgress?.(90);
  
  // Combine salt + iv + encrypted data
  const result = new Uint8Array(
    salt.length + iv.length + encryptedData.byteLength
  );
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);
  
  onProgress?.(100);
  
  return new Blob([result], { type: 'application/encrypted' });
}

/**
 * Decrypts an encrypted file with the given password
 * Returns the original file with its metadata restored
 */
export async function decryptFile(
  file: File,
  password: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  onProgress?.(10);
  
  const fileBuffer = await file.arrayBuffer();
  const data = new Uint8Array(fileBuffer);
  
  onProgress?.(20);
  
  // Extract salt and iv
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedData = data.slice(SALT_LENGTH + IV_LENGTH);
  
  onProgress?.(30);
  
  const key = await deriveKey(password, salt);
  
  onProgress?.(50);
  
  let decryptedData: ArrayBuffer;
  try {
    decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );
  } catch {
    throw new Error('Contraseña incorrecta o archivo corrupto');
  }
  
  onProgress?.(70);
  
  const decryptedBytes = new Uint8Array(decryptedData);
  
  // Extract metadata length
  const metadataLength = new Uint32Array(
    decryptedBytes.slice(0, 4).buffer
  )[0];
  
  // Extract metadata
  const metadataBytes = decryptedBytes.slice(4, 4 + metadataLength);
  const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
  
  // Extract file content
  const fileContent = decryptedBytes.slice(4 + metadataLength);
  
  onProgress?.(100);
  
  return {
    blob: new Blob([fileContent], { type: metadata.type || 'application/octet-stream' }),
    filename: metadata.name || 'archivo_descifrado',
    mimeType: metadata.type || 'application/octet-stream',
  };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
