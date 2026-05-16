import { pgTable, uuid, text, timestamp, index, jsonb, numeric } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { customers } from './customers';

export const e_contracts = pgTable(
  'e_contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
      
    contractNumber: text('contract_number').notNull(),
    title: text('title').notNull(),
    
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
      
    // Trạng thái hợp đồng: draft, sent, viewed, signed, expired, cancelled
    status: text('status', {
      enum: ['draft', 'sent', 'viewed', 'signed', 'expired', 'cancelled'],
    }).notNull().default('draft'),
    
    // Tổng giá trị hợp đồng
    totalValue: numeric('total_value', { precision: 15, scale: 2 }),
    
    // Lưu trữ tài liệu (URL file PDF)
    documentUrl: text('document_url'),
    
    // Dữ liệu chữ ký (Lưu metadata của bên ký, tọa độ chữ ký, IP, thời gian)
    signatureData: jsonb('signature_data'),
    
    validFrom: timestamp('valid_from'),
    validUntil: timestamp('valid_until'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('e_contracts_tenant_idx').on(t.tenantId),
    customerIdx: index('e_contracts_customer_idx').on(t.customerId),
    statusIdx: index('e_contracts_status_idx').on(t.status),
  })
);

export type EContract = typeof e_contracts.$inferSelect;
export type NewEContract = typeof e_contracts.$inferInsert;
