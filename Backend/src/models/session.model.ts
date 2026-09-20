import { pool } from '@/config/db';
import { generateSessionToken, hashToken } from '@/utils/hash';

const DURATION_H = Number(process.env.SESSION_DURATION_HOURS ?? 24);

export async function createSession(userId: string, userAgent?: string, ip?: string) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + DURATION_H * 3600 * 1000);

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, userAgent ?? null, ip ?? null],
  );
  return token; // renvoyé au client, jamais stocké en clair
}

export async function findValidSession(token: string) {
  const tokenHash = hashToken(token);
  const result = await pool.query(
    `SELECT s.*, u.id as user_id, u.name, u.role, u.is_admin, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function revokeSession(token: string) {
  const tokenHash = hashToken(token);
  await pool.query(`UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1`, [tokenHash]);
}