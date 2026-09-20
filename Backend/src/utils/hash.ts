import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Token de session : aléatoire, on stocke son hash SHA-256 (rapide, pas besoin de bcrypt ici)
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}
export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}