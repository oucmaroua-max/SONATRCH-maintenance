import 'dotenv/config';               // doit rester en 1re ligne
import express from 'express';
import cors from 'cors';
import { login, logout } from '@/controllers/auth.controller';
import { getOrgTree, addSousDirection, addDepartement, addService } from '@/controllers/org.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);

app.get('/api/org', requireAuth, getOrgTree);
app.post('/api/org/sous-directions', requireAuth, requireAdmin, addSousDirection);
app.post('/api/org/departements', requireAuth, requireAdmin, addDepartement);
app.post('/api/org/services', requireAuth, requireAdmin, addService);

app.listen(Number(process.env.PORT ?? 3000), () =>
  console.log(`API sur http://127.0.0.1:${process.env.PORT ?? 3000}`));