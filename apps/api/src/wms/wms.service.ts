import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { warehouseLocations, warehouseTasks, warehouseTaskItems, products } from '@smart-erp/database/schema';
import { eq, and, sql, desc } from '@smart-erp/database/drizzle';

@Injectable()
export class WmsService {
  /**
   * Generate Picking List for an Order
   */
  async createPickingTask(tenantId: string, data: { orderId: string; items: { productId: string; quantity: number }[] }) {
    const [task] = await db.insert(warehouseTasks).values({
      tenantId,
      type: 'pick',
      status: 'pending',
      referenceType: 'sale_order',
      referenceId: data.orderId,
      priority: 'high',
    }).returning();

    for (const item of data.items) {
      // Find optimal storage location (FIFO or nearest)
      const [location] = await db
        .select()
        .from(warehouseLocations)
        .where(and(eq(warehouseLocations.tenantId, tenantId), eq(warehouseLocations.type, 'storage')))
        .limit(1);

      await db.insert(warehouseTaskItems).values({
        taskId: task.id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        fromLocationId: location?.id || null,
      });
    }

    return task;
  }

  async listTasks(tenantId: string, type?: string) {
    const conditions = [eq(warehouseTasks.tenantId, tenantId)];
    if (type) conditions.push(eq(warehouseTasks.type, type as any));

    return db
      .select()
      .from(warehouseTasks)
      .where(and(...conditions))
      .orderBy(desc(warehouseTasks.createdAt));
  }

  async getTaskDetails(tenantId: string, taskId: string) {
    const [task] = await db
      .select()
      .from(warehouseTasks)
      .where(and(eq(warehouseTasks.id, taskId), eq(warehouseTasks.tenantId, tenantId)))
      .limit(1);

    if (!task) throw new NotFoundException('Task not found');

    const items = await db
      .select({
        id: warehouseTaskItems.id,
        productName: products.name,
        quantity: warehouseTaskItems.quantity,
        fromLocationCode: warehouseLocations.code,
        pickedQuantity: warehouseTaskItems.pickedQuantity,
      })
      .from(warehouseTaskItems)
      .innerJoin(products, eq(warehouseTaskItems.productId, products.id))
      .leftJoin(warehouseLocations, eq(warehouseTaskItems.fromLocationId, warehouseLocations.id))
      .where(eq(warehouseTaskItems.taskId, taskId));

    return { ...task, items };
  }

  async confirmPick(tenantId: string, itemId: string, quantity: number) {
    return db
      .update(warehouseTaskItems)
      .set({ pickedQuantity: quantity.toString() })
      .where(eq(warehouseTaskItems.id, itemId))
      .returning();
  }
}
