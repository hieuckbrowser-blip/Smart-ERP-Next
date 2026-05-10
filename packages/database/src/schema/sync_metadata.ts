import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const syncMetadata = pgTable(
  'sync_metadata',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    clientId: text('client_id').notNull(),
    lastSyncAt: timestamp('last_sync_at').defaultNow().notNull(),
    vectorClock: jsonb('vector_clock').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantClientIdx: index('sync_metadata_tenant_client_idx').on(table.tenantId, table.clientId),
  })
);

export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;
