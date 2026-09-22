import { Request, Response } from 'express';
import { OrgModel } from '@/models/org.model';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const param = (req: Request, key: string) => String(req.params[key]);

export async function getOrgTree(_req: Request, res: Response) {
  const [sousDirections, departements, services] = await Promise.all([
    OrgModel.getSousDirections(), OrgModel.getDepartements(), OrgModel.getServices(),
  ]);
  res.json({ sousDirections, departements, services });
}

/* ---------- création ---------- */
export async function addSousDirection(req: Request, res: Response) {
  const name = str(req.body?.name), abrv = str(req.body?.abrv).toUpperCase();
  if (!name || !abrv) return res.status(400).json({ error: 'Nom et abréviation requis' });
  res.status(201).json(await OrgModel.createSousDirection(name, abrv));
}
export async function addDepartement(req: Request, res: Response) {
  const name = str(req.body?.name), abrv = str(req.body?.abrv).toUpperCase();
  const parent = str(req.body?.sousDirectionAbrv);
  if (!name || !abrv || !parent) return res.status(400).json({ error: 'Nom, abréviation et sous-direction requis' });
  res.status(201).json(await OrgModel.createDepartement(name, abrv, parent));
}
export async function addService(req: Request, res: Response) {
  const name = str(req.body?.name), abrv = str(req.body?.abrv).toUpperCase();
  const parent = str(req.body?.departementAbrv);
  if (!name || !abrv || !parent) return res.status(400).json({ error: 'Nom, abréviation et département requis' });
  res.status(201).json(await OrgModel.createService(name, abrv, parent));
}

/* ---------- mise à jour (l'abréviation est la clé étrangère : non modifiable) ---------- */
export async function editSousDirection(req: Request, res: Response) {
  const name = str(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const updated = await OrgModel.updateSousDirection(param(req, 'abrv'), { name });
  if (!updated) return res.status(404).json({ error: 'Introuvable' });
  res.json(updated);
}
export async function editDepartement(req: Request, res: Response) {
  const name = str(req.body?.name), parent = str(req.body?.sousDirectionAbrv);
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const patch: { name: string; sousDirectionAbrv?: string } = { name };
  if (parent) patch.sousDirectionAbrv = parent;
  const updated = await OrgModel.updateDepartement(param(req, 'abrv'), patch);
  if (!updated) return res.status(404).json({ error: 'Introuvable' });
  res.json(updated);
}
export async function editService(req: Request, res: Response) {
  const name = str(req.body?.name), parent = str(req.body?.departementAbrv);
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const patch: { name: string; departementAbrv?: string } = { name };
  if (parent) patch.departementAbrv = parent;
  const updated = await OrgModel.updateService(param(req, 'abrv'), patch);
  if (!updated) return res.status(404).json({ error: 'Introuvable' });
  res.json(updated);
}

/* ---------- suppression ---------- */
export async function removeSousDirection(req: Request, res: Response) {
  const rows = await OrgModel.deleteSousDirection(param(req, 'abrv'));
  if (rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
  res.status(204).send();
}
export async function removeDepartement(req: Request, res: Response) {
  const rows = await OrgModel.deleteDepartement(param(req, 'abrv'));
  if (rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
  res.status(204).send();
}
export async function removeService(req: Request, res: Response) {
  const rows = await OrgModel.deleteService(param(req, 'abrv'));
  if (rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
  res.status(204).send();
}