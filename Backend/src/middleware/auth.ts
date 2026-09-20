import { NextFunction, Request, Response } from 'express';
import { findValidSession } from '@/models/session.model';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  const s = await findValidSession(token);
  if (!s || s.status !== 'active') return res.status(401).json({ error: 'Session invalide' });
  (req as any).auth = { userId: s.user_id, role: s.role, isAdmin: s.is_admin };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).auth?.isAdmin) return res.status(403).json({ error: 'Accès administrateur requis' });
  next();
}