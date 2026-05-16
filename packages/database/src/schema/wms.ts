import { pgTable, uuid, text, timestamp, decimal, integer, index, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { warehouses } from './warehouses';
import { products } from './products';

export const warehouseLocations = pgTable(
  'warehouse_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
      
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
      
    code: text('code').notNull(), // e.g., 'A-01-05' (Aisle A, Rack 01, Bin 05)
    name: text('name').notNull(),
    
    type: text('type', { enum: ['storage', 'picking', 'packing', 'receiving', 'shipping'] }).default('storage'),
    
    isActive: boolean('is_active').default(true),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('wms_loc_tenant_idx').on(t.tenantId),
    warehouseIdx: index('wms_loc_warehouse_idx').on(t.warehouseId),
    codeIdx: index('wms_loc_code_idx').on(t.tenantId, t.warehouseId, t.code),
  })
);

export const warehouseTasks = pgTable(
  'warehouse_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
      
    type: text('type', { enum: ['pick', 'pack', 'putaway', 'transfer'] }).notNull(),
    status: text('status', { enum: ['pending', 'in_progress', 'completed', 'cancelled'] }).default('pending'),
    
    priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
    
    referenceType: text('reference_type'), // 'sale_order', 'purchase_order', 'transfer'
    referenceId: uuid('reference_id'),
    
    assignedTo: uuid('assigned_to'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (t) => ({
    tenantIdx: index('wms_task_tenant_idx').on(t.tenantId),
    statusIdx: index('wms_task_status_idx').on(t.status),
  })
);

export const warehouseTaskItems = pgTable(
  'warehouse_task_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => warehouseTasks.id, { onDelete: 'cascade' }),
      
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
      
    quantity: decimal('quantity', { precision: 20, scale: 2 }).notNull(),
    
    fromLocationId: uuid('from_location_id').references(() => warehouseLocations.id),
    toLocationId: uuid('to_location_id').references(() => warehouseLocations.id),
    
    pickedQuantity: decimal('picked_quantity', { precision: 20, scale: 2 }).default('0'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    taskIdx: index('wms_task_item_task_idx').on(t.taskId),
  })
);

export type WarehouseLocation = typeof warehouseLocations.$inferSelect;
export type WarehouseTask = typeof warehouseTasks.$inferSelect;
export type WarehouseTaskItem = typeof warehouseTaskItems.$inferSelect;
