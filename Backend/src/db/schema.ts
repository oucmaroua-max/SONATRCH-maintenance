import {
  pgTable, pgEnum, uuid, text, boolean, timestamp, integer, jsonb, inet,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ---------- ENUMS ---------- */
export const roleEnum = pgEnum('role', ['directeur', 'sous_directeur', 'chef_departement', 'chef_service', 'employe']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'inactive', 'suspended']);
export const workStatusEnum = pgEnum('work_status', ['en_cours', 'termine', 'annule', 'en_attente']);
export const interimStatusEnum = pgEnum('interim_status', ['active', 'termine', 'annule']);
export const adminActionEnum = pgEnum('admin_action', ['create', 'update', 'approve', 'suspend', 'reactivate', 'reset_password']);

/* ---------- sous_directions ---------- */
export const sousDirections = pgTable('sous_directions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  abrv: text('abrv').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ---------- departements ---------- */
export const departements = pgTable('departements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  abrv: text('abrv').notNull().unique(),
  sousDirectionAbrv: text('sous_direction_abrv').references(() => sousDirections.abrv),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ---------- services ---------- */
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  abrv: text('abrv').notNull().unique(),
  departementAbrv: text('departement_abrv').references(() => departements.abrv),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ---------- users ---------- */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  role: roleEnum('role'),
  status: userStatusEnum('status').notNull().default('pending'),
  sousDirectionAbrv: text('sous_direction_abrv').references(() => sousDirections.abrv),
  departementAbrv: text('departement_abrv').references(() => departements.abrv),
  serviceAbrv: text('service_abrv').references(() => services.abrv),
  isAdmin: boolean('is_admin').notNull().default(false),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  invitedBy: uuid('invited_by'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
});

/* ---------- sessions ---------- */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  tokenHash: text('token_hash').notNull(),
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
});

/* ---------- interim_periods ---------- */
export const interimPeriods = pgTable('interim_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  delegatingUserId: uuid('delegating_user_id').notNull().references(() => users.id),
  delegateUserId: uuid('delegate_user_id').notNull().references(() => users.id),
  startDate: text('start_date').notNull(), // DATE -> tu peux aussi utiliser date()
  endDate: text('end_date').notNull(),
  status: interimStatusEnum('status').notNull().default('active'),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  endedBy: uuid('ended_by').references(() => users.id),
});

/* ---------- works ---------- */
export const works = pgTable('works', {
  id: uuid('id').primaryKey().defaultRandom(),
  initiatorId: uuid('initiator_id').notNull().references(() => users.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  responsibleId: uuid('responsible_id').notNull().references(() => users.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  descriptionPrevue: text('description_prevue').notNull(),
  descriptionRealisee: text('description_realisee'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  status: workStatusEnum('status').notNull().default('en_cours'),
  workerCount: integer('worker_count').notNull(),
  observation: text('observation'),
  finishedAt: timestamp('finished_at'),
  finishedBy: uuid('finished_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/* ---------- work_feedback ---------- */
export const workFeedback = pgTable('work_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  workId: uuid('work_id').notNull().references(() => works.id),
  authorId: uuid('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ---------- user_position_history ---------- */
export const userPositionHistory = pgTable('user_position_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  oldRole: roleEnum('old_role'),
  oldSousDirectionAbrv: text('old_sous_direction_abrv'),
  oldDepartementAbrv: text('old_departement_abrv'),
  oldServiceAbrv: text('old_service_abrv'),
  newRole: roleEnum('new_role'),
  newSousDirectionAbrv: text('new_sous_direction_abrv'),
  newDepartementAbrv: text('new_departement_abrv'),
  newServiceAbrv: text('new_service_abrv'),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
  changedBy: uuid('changed_by').references(() => users.id),
  reason: text('reason'),
});

/* ---------- admin_audit_log ---------- */
export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => users.id),
  targetUserId: uuid('target_user_id').notNull().references(() => users.id),
  action: adminActionEnum('action').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Relations (pour les requêtes avec .query.xxx.findMany({with:...})) */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ one, many }) => ({
  sousDirection: one(sousDirections, { fields: [users.sousDirectionAbrv], references: [sousDirections.abrv] }),
  departement: one(departements, { fields: [users.departementAbrv], references: [departements.abrv] }),
  service: one(services, { fields: [users.serviceAbrv], references: [services.abrv] }),
  sessions: many(sessions),
  initiatedWorks: many(works, { relationName: 'initiator' }),
}));

export const departementsRelations = relations(departements, ({ one, many }) => ({
  sousDirection: one(sousDirections, { fields: [departements.sousDirectionAbrv], references: [sousDirections.abrv] }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  departement: one(departements, { fields: [services.departementAbrv], references: [departements.abrv] }),
  works: many(works),
}));

export const worksRelations = relations(works, ({ one, many }) => ({
  initiator: one(users, { fields: [works.initiatorId], references: [users.id], relationName: 'initiator' }),
  assignedTo: one(users, { fields: [works.assignedToId], references: [users.id] }),
  responsible: one(users, { fields: [works.responsibleId], references: [users.id] }),
  service: one(services, { fields: [works.serviceId], references: [services.id] }),
  feedbacks: many(workFeedback),
}));