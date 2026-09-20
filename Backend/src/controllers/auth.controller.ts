import { Request, Response } from 'express';
import { findUserById } from '@/models/user.model';
import { createSession, revokeSession } from '@/models/session.model';
import { verifyPassword } from '@/utils/hash';
import { users} from '@/db/schema';

export async function login(req: Request, res: Response) {
  const { id, password } = req.body;
  const user = await findUserById(id);
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await verifyPassword(password, users.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  if (user.status !== 'active') {
    return res.status(403).json({ error: `Compte ${user.status}, accès refusé` });
  }

  const token = await createSession(user.id, req.headers['user-agent'], req.ip);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
}

export async function logout(req: Request, res: Response) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) await revokeSession(token);
  res.status(204).send();
}