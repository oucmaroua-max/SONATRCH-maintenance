import { Request, Response } from 'express';
import { findUserByIdentifier, findUserById } from '@/models/user.model';
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

import { listMyInterims } from '@/models/interim.model';

export async function me(req: Request, res: Response) {
  const { userId } = (req as any).auth;
  const user = await findUserById(userId);
  if (!user) return res.status(401).json({ error: 'Session invalide' });
  const { passwordHash, ...safeUser } = user;

  const myInterims = (await listMyInterims(userId)).filter((i) => i.status === 'active' && i.delegateUserId === userId);
  const activeInterimsAsDelegate = await Promise.all(myInterims.map(async (i) => {
    const delegating = await findUserById(i.delegatingUserId);
    return {
      id: i.id, startDate: i.startDate, endDate: i.endDate, reason: i.reason,
      delegatingUser: delegating ? {
        id: delegating.id, name: delegating.name, role: delegating.role,
        sousDirectionAbrv: delegating.sousDirectionAbrv,
        departementAbrv: delegating.departementAbrv,
        serviceAbrv: delegating.serviceAbrv,
      } : null,
    };
  }));

  res.json({ user: safeUser, activeInterimsAsDelegate });
}

export async function logout(req: Request, res: Response) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) await revokeSession(token);
  res.status(204).send();
}