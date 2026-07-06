/**
 * Modulo per gestione autenticazione a 2 fattori (TOTP)
 * ESM module: usa speakeasy per TOTP e qrcode per QR code
 */
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Chiave per cifratura secret (in produzione usare variabile ambiente!)
const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('❌ ERRORE CRITICO: La variabile d\'ambiente TOTP_ENCRYPTION_KEY non è impostata o è troppo corta (richiesti 32 caratteri).');
  // In un ambiente di produzione, questo dovrebbe fermare l'applicazione.
  // process.exit(1); // Decommenta se necessario per bloccare l'avvio.
}
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/** Cifra il secret TOTP (ritorna formato iv:encrypted) */
export function encryptSecret(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/** Decifra il secret TOTP dal formato iv:encrypted */
export function decryptSecret(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/** Genera secret TOTP e QR code */
export async function generateTOTPSecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `Vincanto (${userEmail})`,
    issuer: 'Vincanto',
    length: 32
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCodeUrl, otpauthUrl: secret.otpauth_url };
}

/** Verifica token TOTP (6 cifre), opzionale decifratura secret */
export function verifyTOTP(token, secret, isEncrypted = false) {
  try {
    const actualSecret = isEncrypted ? decryptSecret(secret) : secret;
    return speakeasy.totp.verify({
      secret: actualSecret,
      encoding: 'base32',
      token,
      window: 1
    });
  } catch (error) {
    console.error('Errore verifica TOTP:', error);
    return false;
  }
}

/** Genera codici di recovery e relativi hash (bcrypt) */
export async function generateRecoveryCodes(count = 10) {
  const codes = [];
  const hashes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
    const hash = await bcrypt.hash(code, 10);
    hashes.push(hash);
  }
  return { codes, hashes };
}

/** Verifica un codice di recovery contro lista di hash */
export async function verifyRecoveryCode(code, hashes) {
  for (let i = 0; i < hashes.length; i++) {
    const match = await bcrypt.compare(code.toUpperCase(), hashes[i]);
    if (match) return { valid: true, usedIndex: i };
  }
  return { valid: false, usedIndex: -1 };
}

/** Rate limiting in-memory (per produzione usare Redis) */
const loginAttempts = new Map();

export function checkRateLimit(identifier, maxAttempts = 5, windowMs = 5 * 60 * 1000) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  if (recentAttempts.length >= maxAttempts) return false;
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);
  return true;
}

export function resetRateLimit(identifier) {
  loginAttempts.delete(identifier);
}
