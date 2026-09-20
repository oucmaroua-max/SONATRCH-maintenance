import { Request, Response } from 'express';
import { OrgModel } from '@/models/org.model';

export async function getOrgTree(req: Request, res: Response) {
  const [sousDirections, departements, services] = await Promise.all([
    OrgModel.getSousDirections(), OrgModel.getDepartements(), OrgModel.getServices(),
  ]);
  res.json({ sousDirections, departements, services });
}

export async function addSousDirection(req: Request, res: Response) {
  const { name, abrv } = req.body;
  res.status(201).json(await OrgModel.createSousDirection(name, abrv));
}
export async function addDepartement(req: Request, res: Response) {
  const { name, abrv, sousDirectionAbrv } = req.body;
  res.status(201).json(await OrgModel.createDepartement(name, abrv, sousDirectionAbrv));
}
export async function addService(req: Request, res: Response) {
  const { name, abrv, departementAbrv } = req.body;
  res.status(201).json(await OrgModel.createService(name, abrv, departementAbrv));
}