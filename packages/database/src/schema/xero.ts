import { pgTable, uuid, varchar, timestamp, boolean, text, integer, index } from 'drizzle-orm/pg-core';

export const xeroConnections = pgTable('xero_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  xeroTenantId: varchar('xero_tenant_id', { length: 100 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  scope: text('scope'),
  tokenType: varchar('token_type', { length: 50 }),
  connectedAt: timestamp('connected_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const xeroSyncLogs = pgTable('xero_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  connectionId: uuid('connection_id').references(() => xeroConnections.id),
  syncType: varchar('sync_type', { length: 50 }).notNull(), // 'invoice', 'contact', 'item'
  syncDirection: varchar('sync_direction', { length: 20 }).notNull(), // 'import', 'export'
  status: varchar('status', { length: 20 }).notNull(), // 'success', 'failed', 'partial'
  recordsProcessed: integer('records_processed').default(0),
  recordsFailed: integer('records_failed').default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow(),
});