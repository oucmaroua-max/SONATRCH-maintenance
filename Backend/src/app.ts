import 'dotenv/config';               // doit rester en 1re ligne
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { login, logout, me } from '@/controllers/auth.controller';
import * as org from '@/controllers/org.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import * as userCtrl from '@/controllers/user.controller';

import * as interimCtrl from '@/controllers/interim.controller';
import * as workCtrl from '@/controllers/work.controller';

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:5173' }));
app.use(express.json());



// Travaux
app.get('/api/works', requireAuth, workCtrl.listWorks);
app.get('/api/works/assignable-users', requireAuth, workCtrl.listAssignableUsers);
app.post('/api/works', requireAuth, workCtrl.createWork);
app.get('/api/works/:id', requireAuth, workCtrl.getWork);
app.patch('/api/works/:id', requireAuth, workCtrl.updateWork);
app.post('/api/works/:id/feedback', requireAuth, workCtrl.addFeedback);


app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', requireAuth, me);

app.get('/api/org', requireAuth, org.getOrgTree);

const admin = [requireAuth, requireAdmin];
app.get('/api/interims/mine', requireAuth, interimCtrl.mine);
app.get('/api/interims', ...admin, interimCtrl.list);
app.post('/api/interims', ...admin, interimCtrl.create);
app.patch('/api/interims/:id/end', ...admin, interimCtrl.end);
app.post('/api/org/sous-directions', ...admin, org.addSousDirection);
app.post('/api/org/departements', ...admin, org.addDepartement);
app.post('/api/org/services', ...admin, org.addService);

app.patch('/api/org/sous-directions/:abrv', ...admin, org.editSousDirection);
app.patch('/api/org/departements/:abrv', ...admin, org.editDepartement);
app.patch('/api/org/services/:abrv', ...admin, org.editService);

app.delete('/api/org/sous-directions/:abrv', ...admin, org.removeSousDirection);
app.delete('/api/org/departements/:abrv', ...admin, org.removeDepartement);
app.delete('/api/org/services/:abrv', ...admin, org.removeService);

app.get('/api/users', ...admin, userCtrl.listUsers);
app.get('/api/users/:id', ...admin, userCtrl.getUser);
app.post('/api/users', ...admin, userCtrl.createUserHandler);
app.patch('/api/users/:id', ...admin, userCtrl.updateUserHandler);
app.patch('/api/users/:id/status', ...admin, userCtrl.updateUserStatusHandler);
app.post('/api/users/:id/reset-password', ...admin, userCtrl.resetPasswordHandler);

// Gestion d'erreurs (doit être après les routes)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
  const code = err?.code ?? err?.cause?.code;          // drizzle enveloppe l'erreur pg dans .cause
  if (code === '23505') return res.status(409).json({ error: 'Cette abréviation existe déjà' });
  if (code === '23503') return res.status(409).json({ error: 'Opération impossible : éléments rattachés ou parent introuvable' });
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(Number(process.env.PORT ?? 3000), () =>
  console.log(`API sur http://127.0.0.1:${process.env.PORT ?? 3000}`));