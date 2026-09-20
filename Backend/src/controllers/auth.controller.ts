import { Request, Response } from 'express';
import { findUserByIdentifier } from '@/models/user.model';
import { createSession, revokeSession } from '@/models/session.model';
import { verifyPassword } from '@/utils/hash';

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body ?? {};
  if (typeof identifier !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' });

  const user = await findUserByIdentifier(identifier.trim());
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return res.status(401).json({ error: 'Identifiants invalides' });

  if (user.status !== 'active')
    return res.status(403).json({ error: `Compte ${user.status}, accès refusé` });

  const token = await createSession(user.id, req.headers['user-agent'], req.ip);
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
}

export async function logout(req: Request, res: Response) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) await revokeSession(token);
  res.status(204).send();
}