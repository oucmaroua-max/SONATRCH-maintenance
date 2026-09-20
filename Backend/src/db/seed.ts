import { db, pool } from './client';
import { users } from './schema';
import { hashPassword } from '@/utils/hash';

async function main() {
  await db.insert(users).values({
    name: 'Admin Test', username: 'admin', email: 'admin@sonatrach.dz',
    passwordHash: await hashPassword('Admin123!'),
    role: 'directeur', status: 'active', isAdmin: true,
  }).onConflictDoNothing();
  await pool.end();
}
main();