import { db, pool } from './client';
import { users, sousDirections, departements, services } from './schema';
import { hashPassword } from '@/utils/hash';

async function main() {
  await db.insert(sousDirections).values([
    { name: 'Sous-direction Maintenance', abrv: 'SDM' },
    { name: 'Sous-direction Exploitation', abrv: 'SDE' },
    { name: 'Sous-direction HSE', abrv: 'SDH' },
  ]).onConflictDoNothing();

  await db.insert(departements).values([
    { name: 'Département Mécanique', abrv: 'MEC', sousDirectionAbrv: 'SDM' },
    { name: 'Département Instrumentation', abrv: 'INS', sousDirectionAbrv: 'SDM' },
    { name: 'Département Procédé', abrv: 'PRC', sousDirectionAbrv: 'SDE' },
    { name: 'Département Sécurité', abrv: 'SEC', sousDirectionAbrv: 'SDH' },
  ]).onConflictDoNothing();

  await db.insert(services).values([
    { name: 'Service Rotatives', abrv: 'ROT', departementAbrv: 'MEC' },
    { name: 'Service Statiques', abrv: 'STT', departementAbrv: 'MEC' },
    { name: 'Service Régulation', abrv: 'REG', departementAbrv: 'INS' },
    { name: 'Service Analyseurs', abrv: 'ANL', departementAbrv: 'INS' },
    { name: 'Service Prévention', abrv: 'PRV', departementAbrv: 'SEC' },
  ]).onConflictDoNothing();

  await db.insert(users).values({
    name: 'Admin Test', username: 'admin', email: 'admin@sonatrach.dz',
    passwordHash: await hashPassword('Admin123!'),
    role: 'directeur', status: 'active', isAdmin: true,
  }).onConflictDoNothing();
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => pool.end());